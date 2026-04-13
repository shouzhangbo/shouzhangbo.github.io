# 模块九：架构设计

> 资深工程师的核心竞争力，P6/P7 必须能设计高并发高可用系统

---

## 1. 分布式系统理论

### 1.1 CAP 理论 ⭐

**三个特性**：
- **C（Consistency）一致性**：所有节点同一时刻看到相同数据
- **A（Availability）可用性**：每个请求都能收到响应（不保证最新数据）
- **P（Partition Tolerance）分区容错性**：网络分区时系统仍能运行

**核心结论**：分布式系统中，P 是必须保证的（网络分区不可避免），因此只能在 C 和 A 之间权衡。

| 选择 | 说明 | 典型系统 |
|------|------|----------|
| CP | 保证一致性，牺牲可用性 | ZooKeeper、HBase、etcd |
| AP | 保证可用性，牺牲一致性 | Cassandra、CouchDB、Eureka |

### 1.2 BASE 理论

对 CAP 中 AP 的延伸，是互联网系统的实践总结：

- **BA（Basically Available）基本可用**：允许损失部分可用性（响应时间延长、功能降级）
- **S（Soft State）软状态**：允许系统存在中间状态（数据同步有延迟）
- **E（Eventually Consistent）最终一致性**：经过一段时间后，数据最终达到一致

### 1.3 Paxos 与 Raft

**Paxos**：分布式共识算法，难以理解和实现，是 Raft 的理论基础。

**Raft**：更易理解的共识算法，分为三个子问题：

```
Leader 选举：
1. 初始所有节点是 Follower
2. 超时未收到 Leader 心跳 → 变为 Candidate，发起选举
3. 获得多数票 → 成为 Leader
4. Leader 定期发送心跳维持地位

日志复制：
1. 客户端请求发给 Leader
2. Leader 将日志追加到本地，发送给所有 Follower
3. 多数 Follower 确认 → Leader 提交日志，通知客户端
4. Leader 通知 Follower 提交

安全性：
- 只有拥有最新日志的节点才能成为 Leader
```

**应用**：etcd（Kubernetes 配置存储）、TiKV（TiDB 存储层）、Consul

---

## 2. 微服务架构设计

### 2.1 微服务拆分原则

```
拆分策略：
1. 按业务领域拆分（DDD 限界上下文）
   - 用户服务、订单服务、商品服务、支付服务

2. 按团队组织拆分（康威定律）
   - 团队规模决定服务粒度

3. 拆分粒度原则：
   - 单一职责：每个服务只做一件事
   - 高内聚低耦合：服务内部高内聚，服务间低耦合
   - 独立部署：每个服务可以独立发布
   - 数据隔离：每个服务有自己的数据库

拆分反模式：
- 过度拆分（纳米服务）：服务太细，网络开销大，事务复杂
- 分布式单体：服务间强耦合，无法独立部署
```

### 2.2 服务治理

```
注册发现：
- Nacos（推荐）：支持 AP/CP 切换，配置中心+注册中心
- Eureka：AP 模式，简单易用
- Consul：CP 模式，支持健康检查

负载均衡：
- 客户端负载均衡：Ribbon/LoadBalancer（从注册中心获取实例列表，本地选择）
- 服务端负载均衡：Nginx/HAProxy（代理层选择）

负载均衡算法：
- 轮询（Round Robin）：依次分配
- 加权轮询：按权重分配（性能不同的机器）
- 随机：随机选择
- 最少连接：选择当前连接数最少的
- 一致性哈希：相同 key 路由到相同节点（有状态服务）
```

### 2.3 熔断限流

```java
// 熔断器（Circuit Breaker）状态机
// 关闭（Closed）→ 打开（Open）→ 半开（Half-Open）→ 关闭

// Resilience4j 熔断器
CircuitBreakerConfig config = CircuitBreakerConfig.custom()
    .failureRateThreshold(50)           // 失败率 > 50% 时打开
    .waitDurationInOpenState(Duration.ofSeconds(30))  // 打开状态持续30秒
    .slidingWindowSize(10)              // 滑动窗口大小
    .build();

CircuitBreaker cb = CircuitBreaker.of("userService", config);

// 限流算法
// 1. 令牌桶（Token Bucket）：以固定速率生成令牌，请求消耗令牌，允许突发
// 2. 漏桶（Leaky Bucket）：请求进入桶，以固定速率流出，平滑流量
// 3. 固定窗口：统计固定时间窗口内的请求数
// 4. 滑动窗口：更精确，避免窗口边界突刺

// Guava RateLimiter（令牌桶）
RateLimiter limiter = RateLimiter.create(100.0);  // 每秒100个请求
if (limiter.tryAcquire()) {
    // 处理请求
} else {
    // 限流，返回 429
}
```

---

## 3. 分布式事务 ⭐

### 3.1 两阶段提交（2PC）

```
协调者（Coordinator）
    ↓ Phase 1: Prepare
参与者1、参与者2、参与者3
    ↓ 所有参与者返回 Yes
协调者
    ↓ Phase 2: Commit
参与者1、参与者2、参与者3

问题：
- 同步阻塞：参与者等待协调者响应期间锁定资源
- 单点故障：协调者宕机导致参与者永久阻塞
- 数据不一致：Phase 2 部分参与者收到 Commit，部分未收到
```

### 3.2 TCC（Try-Confirm-Cancel）

```java
// 适用：强一致性要求，业务可以拆分为 Try/Confirm/Cancel

// 订单服务
@TccTransaction
public void createOrder(OrderRequest request) {
    // Try：预留资源（冻结库存、冻结余额）
    inventoryService.tryReserve(request.getItems());
    paymentService.tryFreeze(request.getAmount());
    
    // Confirm：确认提交（扣减库存、扣减余额）
    // Cancel：取消回滚（释放冻结库存、释放冻结余额）
}

// 注意事项：
// 1. 幂等性：Confirm/Cancel 可能被重复调用
// 2. 空回滚：Try 未执行，Cancel 被调用（需要记录 Try 是否执行）
// 3. 悬挂：Cancel 先于 Try 执行（需要拒绝后续的 Try）
```

### 3.3 Saga 模式

```
适用：长事务，允许最终一致性

编排式 Saga（Orchestration）：
中央协调器控制事务流程
OrderService → InventoryService → PaymentService → ShippingService
    ↓ 失败时反向补偿
ShippingService.cancel → PaymentService.refund → InventoryService.release

编排式 Saga（Choreography）：
服务间通过事件驱动，无中央协调器
OrderCreated → InventoryReserved → PaymentProcessed → ShipmentCreated
    ↓ 失败时发布补偿事件
PaymentFailed → InventoryReleased → OrderCancelled
```

### 3.4 本地消息表

```java
// 最终一致性，适合跨服务的异步操作

// 1. 业务操作和消息写入同一本地事务
@Transactional
public void createOrder(Order order) {
    orderRepository.save(order);
    // 写入本地消息表（同一事务）
    messageRepository.save(new Message("ORDER_CREATED", order.getId(), "PENDING"));
}

// 2. 定时任务扫描未发送的消息，发送到 MQ
@Scheduled(fixedDelay = 1000)
public void sendPendingMessages() {
    List<Message> messages = messageRepository.findByStatus("PENDING");
    for (Message msg : messages) {
        try {
            mqProducer.send(msg);
            msg.setStatus("SENT");
            messageRepository.save(msg);
        } catch (Exception e) {
            // 发送失败，下次重试
        }
    }
}

// 3. 消费者幂等处理（消息可能重复）
@MqListener
public void onOrderCreated(Message msg) {
    if (processedMessageRepository.exists(msg.getId())) {
        return;  // 已处理，幂等
    }
    // 处理业务
    processedMessageRepository.save(msg.getId());
}
```

---

## 4. 消息队列设计

### 4.1 Kafka vs RocketMQ 对比 ⭐

| 维度 | Kafka | RocketMQ |
|------|-------|----------|
| 定位 | 高吞吐日志/流处理 | 金融级消息中间件 |
| 吞吐量 | 极高（百万/秒） | 高（十万/秒） |
| 延迟 | 毫秒级 | 毫秒级 |
| 消息顺序 | 分区内有序 | 队列内有序 |
| 事务消息 | 支持（0.11+） | 支持 |
| 延迟消息 | 不支持（需插件） | 支持（18个级别） |
| 死信队列 | 不支持 | 支持 |
| 消息回溯 | 支持（按 offset/时间） | 支持 |
| 消费模式 | Pull | Push/Pull |
| 适用场景 | 日志收集、流计算 | 订单、支付、通知 |

### 4.2 Kafka 核心原理

```
Kafka 架构：
Producer → Broker（Topic/Partition）→ Consumer Group

分区（Partition）：
- 每个 Topic 分为多个 Partition，提高并行度
- 每个 Partition 是有序的日志文件
- 消费者组内每个 Partition 只被一个消费者消费

副本（Replica）：
- 每个 Partition 有多个副本（Leader + Follower）
- 生产者写 Leader，Follower 同步
- Leader 宕机时，ISR（In-Sync Replicas）中选新 Leader

消息可靠性：
- acks=0：不等确认（最快，可能丢失）
- acks=1：Leader 确认（可能丢失，Leader 宕机前未同步）
- acks=-1/all：所有 ISR 确认（最安全）

消费者偏移量（Offset）：
- 消费者自己管理 offset（存储在 __consumer_offsets topic）
- 手动提交 offset 保证 at-least-once 语义
- 幂等消费保证 exactly-once
```

### 4.3 消息可靠性保证

```java
// 生产者：确保消息发送成功
// 1. 同步发送 + 重试
ProducerRecord<String, String> record = new ProducerRecord<>("topic", key, value);
try {
    RecordMetadata metadata = producer.send(record).get();  // 同步等待
} catch (Exception e) {
    // 重试或记录失败消息
}

// 2. 幂等生产者（Kafka 0.11+）
props.put("enable.idempotence", true);  // 防止重复发送

// 消费者：确保消息处理成功
// 手动提交 offset（处理完成后才提交）
consumer.poll(Duration.ofMillis(100)).forEach(record -> {
    try {
        process(record);
        consumer.commitSync();  // 处理成功后提交
    } catch (Exception e) {
        // 处理失败，不提交 offset，下次重新消费
    }
});
```

---

## 5. 高并发系统设计

### 5.1 限流算法

```java
// 令牌桶（Token Bucket）：允许突发流量
public class TokenBucket {
    private final long capacity;
    private final long refillRate;  // 每秒补充令牌数
    private long tokens;
    private long lastRefillTime;
    
    public synchronized boolean tryAcquire() {
        refill();
        if (tokens > 0) {
            tokens--;
            return true;
        }
        return false;
    }
    
    private void refill() {
        long now = System.currentTimeMillis();
        long elapsed = now - lastRefillTime;
        long newTokens = elapsed * refillRate / 1000;
        tokens = Math.min(capacity, tokens + newTokens);
        lastRefillTime = now;
    }
}

// Redis 实现滑动窗口限流
String script = 
    "local key = KEYS[1] " +
    "local now = tonumber(ARGV[1]) " +
    "local window = tonumber(ARGV[2]) " +
    "local limit = tonumber(ARGV[3]) " +
    "redis.call('ZREMRANGEBYSCORE', key, 0, now - window) " +
    "local count = redis.call('ZCARD', key) " +
    "if count < limit then " +
    "    redis.call('ZADD', key, now, now) " +
    "    redis.call('EXPIRE', key, window / 1000) " +
    "    return 1 " +
    "else " +
    "    return 0 " +
    "end";
```

### 5.2 秒杀系统设计

```
秒杀系统核心挑战：
- 瞬时高并发（平时 QPS 100，秒杀 QPS 10万）
- 超卖问题（库存不能为负）
- 数据一致性

分层设计：

1. 前端层：
   - 静态化商品页面（CDN 加速）
   - 按钮防重复点击（前端限流）
   - 验证码/答题（人机验证）

2. 网关层：
   - 限流（令牌桶，每个用户每秒1次）
   - 黑名单过滤
   - 请求合法性校验

3. 应用层：
   - 本地缓存库存（减少 Redis 压力）
   - 异步处理（请求入队，返回排队中）
   - 幂等处理（防重复下单）

4. 缓存层（Redis）：
   - 库存预热（活动开始前加载到 Redis）
   - Lua 脚本原子扣减库存
   - 用户购买记录（防超购）

5. 数据库层：
   - 乐观锁（version 字段）
   - 数据库限流（连接池控制）

// Redis Lua 脚本原子扣减库存
String script = 
    "local stock = tonumber(redis.call('GET', KEYS[1])) " +
    "if stock > 0 then " +
    "    redis.call('DECR', KEYS[1]) " +
    "    return 1 " +
    "else " +
    "    return 0 " +
    "end";
```

### 5.3 接口幂等性设计

```java
// 幂等性：相同请求多次执行，结果与执行一次相同

// 方案1：Token 机制
// 1. 客户端请求前先获取 token（存入 Redis）
// 2. 提交请求时携带 token
// 3. 服务端检查 token 是否存在，存在则处理并删除 token
// 4. token 不存在则认为重复请求，返回上次结果

@PostMapping("/order")
public Result createOrder(@RequestHeader("Idempotency-Key") String token,
                          @RequestBody OrderRequest request) {
    String key = "idempotency:" + token;
    // 原子操作：检查并设置
    Boolean isNew = redisTemplate.opsForValue().setIfAbsent(key, "processing", 10, TimeUnit.MINUTES);
    if (!Boolean.TRUE.equals(isNew)) {
        // 重复请求，返回缓存结果
        String cachedResult = redisTemplate.opsForValue().get(key + ":result");
        return JSON.parseObject(cachedResult, Result.class);
    }
    
    try {
        Result result = orderService.createOrder(request);
        redisTemplate.opsForValue().set(key + ":result", JSON.toJSONString(result), 10, TimeUnit.MINUTES);
        return result;
    } catch (Exception e) {
        redisTemplate.delete(key);  // 失败时删除，允许重试
        throw e;
    }
}

// 方案2：数据库唯一索引
// 订单表添加 (user_id, order_no) 唯一索引
// 重复插入时抛出 DuplicateKeyException，捕获后返回已有订单
```

---

## 6. 高可用架构设计

### 6.1 多活架构

```
同城双活：
- 两个数据中心在同一城市（网络延迟 < 1ms）
- 数据实时同步
- 任一机房故障，流量切换到另一机房

异地多活：
- 数据中心分布在不同城市（网络延迟 10~50ms）
- 数据按用户 ID 分片，就近访问
- 挑战：跨机房数据一致性

单元化架构（美团/阿里实践）：
- 将用户按 ID 分配到不同单元（机房）
- 每个单元包含完整的服务栈
- 单元内请求不跨机房
- 全局数据（商品/配置）多机房同步
```

### 6.2 降级与熔断

```java
// 降级策略
// 1. 返回默认值
// 2. 返回缓存数据（可能过期）
// 3. 返回降级页面
// 4. 关闭非核心功能（如评论、推荐）

// Sentinel 限流降级
@SentinelResource(
    value = "getUserInfo",
    blockHandler = "getUserInfoFallback",  // 限流/熔断时调用
    fallback = "getUserInfoDefault"         // 异常时调用
)
public UserInfo getUserInfo(Long userId) {
    return userService.getUser(userId);
}

public UserInfo getUserInfoFallback(Long userId, BlockException ex) {
    return UserInfo.defaultUser();  // 返回默认值
}

public UserInfo getUserInfoDefault(Long userId, Throwable t) {
    // 从缓存获取
    return cacheService.getCachedUser(userId);
}
```

### 6.3 API 网关设计

```
API 网关职责：
├── 路由转发（根据路径/Header 路由到不同服务）
├── 认证鉴权（JWT 验证、OAuth2）
├── 限流熔断（保护后端服务）
├── 日志追踪（请求链路追踪）
├── 协议转换（HTTP → gRPC）
├── 灰度发布（按比例路由到新版本）
└── 缓存（响应缓存）

常用网关：
- Spring Cloud Gateway（响应式，性能好）
- Nginx + Lua（OpenResty）
- Kong（基于 Nginx，插件丰富）
- APISIX（高性能，云原生）
```

---

## 高频面试真题

### Q1：CAP 理论是什么？如何在实际系统中应用？

**答题框架**：
- CAP：一致性、可用性、分区容错性，三者只能同时满足两个
- 分布式系统 P 必须保证，所以是 CP 或 AP 的选择
- CP 场景：金融交易、配置中心（ZooKeeper）
- AP 场景：购物车、用户信息（允许短暂不一致）
- 实践：BASE 理论，最终一致性

### Q2：分布式事务有哪些解决方案？各自的适用场景？

**答题框架**：
- 2PC：强一致性，但同步阻塞，单点故障，适合数据库层面
- TCC：业务层面的 2PC，需要实现 Try/Confirm/Cancel，适合强一致性要求
- Saga：长事务，最终一致性，通过补偿事务回滚，适合微服务
- 本地消息表：最终一致性，简单可靠，适合跨服务异步操作
- 选择原则：强一致性用 TCC，最终一致性用 Saga/本地消息表

### Q3：如何设计一个高并发的秒杀系统？

**答题框架**：
- 前端：静态化 + CDN + 防重点击 + 验证码
- 网关：限流（每用户每秒1次）+ 黑名单
- 应用：本地缓存 + 异步处理 + 幂等
- Redis：库存预热 + Lua 原子扣减 + 用户购买记录
- 数据库：乐观锁 + 连接池限流
- 关键：分层过滤，让大部分请求在前端/网关/缓存层被拦截

### Q4：Kafka 如何保证消息不丢失？

**答题框架**：
- 生产者：acks=all（所有 ISR 确认）+ 重试 + 幂等生产者
- Broker：副本机制（min.insync.replicas >= 2）+ 持久化
- 消费者：手动提交 offset（处理完成后才提交）+ 幂等消费
- 注意：at-least-once 语义（可能重复），需要消费者幂等处理

### Q5：如何设计接口的幂等性？

**答题框架**：
- Token 机制：请求前获取 token，提交时携带，服务端原子检查并删除
- 数据库唯一索引：利用数据库约束防止重复插入
- 状态机：检查当前状态是否允许操作（如订单只能从待支付→已支付）
- 乐观锁：version 字段，更新时检查版本号
- 选择原则：简单场景用唯一索引；复杂场景用 Token 机制

---

## 学习建议

**备考重点**：CAP/BASE 理论（必考）、分布式事务（必考）、高并发设计（必考）、消息队列（必考）

**推荐资源**：
- 《数据密集型应用系统设计》（DDIA，Martin Kleppmann）—— 分布式系统圣经
- 《微服务架构设计模式》（Chris Richardson）
- 极客时间《从0开始学架构》（李运华）
- 美团技术博客：https://tech.meituan.com/
