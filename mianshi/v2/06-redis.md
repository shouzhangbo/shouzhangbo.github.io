# 模块六：Redis 核心原理 ⭐

> 缓存层核心，P6/P7 必须掌握底层编码、高可用和分布式锁

---

## 1. 数据类型底层编码

### 1.1 String

| 编码 | 条件 | 说明 |
|------|------|------|
| `int` | 整数且 <= 2^63-1 | 直接存储整数值 |
| `embstr` | 字符串长度 <= 44字节 | 连续内存，只读 |
| `raw` | 字符串长度 > 44字节 | SDS，可修改 |

**SDS（Simple Dynamic String）**：

```c
struct sdshdr {
    int len;      // 已使用长度
    int free;     // 剩余空间
    char buf[];   // 字节数组
};
// 优点：O(1) 获取长度；预分配空间减少内存重分配；二进制安全
```

### 1.2 List

| 编码 | 条件 |
|------|------|
| `listpack`（Redis 7.0+）/ `ziplist` | 元素数量 <= 128 且每个元素 <= 64字节 |
| `quicklist` | 超出上述条件 |

**quicklist**：双向链表，每个节点是一个 ziplist/listpack，兼顾内存效率和操作性能。

### 1.3 Hash

| 编码 | 条件 |
|------|------|
| `listpack`/`ziplist` | 字段数 <= 128 且每个值 <= 64字节 |
| `hashtable` | 超出上述条件 |

**渐进式 rehash**：扩容时不一次性迁移，而是分批迁移（每次操作迁移一个桶），避免阻塞。

### 1.4 Set

| 编码 | 条件 |
|------|------|
| `intset` | 全是整数且元素数 <= 512 |
| `listpack`/`ziplist` | 元素数 <= 128 且每个元素 <= 64字节 |
| `hashtable` | 超出上述条件 |

### 1.5 ZSet（Sorted Set）

| 编码 | 条件 |
|------|------|
| `listpack`/`ziplist` | 元素数 <= 128 且每个元素 <= 64字节 |
| `skiplist + hashtable` | 超出上述条件 |

**跳表（skiplist）**：

```
Level 4: 1 ─────────────────────────────── 9
Level 3: 1 ──────────── 5 ──────────────── 9
Level 2: 1 ──── 3 ────── 5 ──── 7 ──────── 9
Level 1: 1 ─ 2 ─ 3 ─ 4 ─ 5 ─ 6 ─ 7 ─ 8 ─ 9

查找时间复杂度：O(log n)
插入/删除：O(log n)
```

跳表 vs 红黑树：
- 跳表实现更简单，范围查询更高效（链表顺序遍历）
- 红黑树内存占用更少，但范围查询需要中序遍历

---

## 2. 持久化机制

### 2.1 RDB（Redis Database）

**原理**：在指定时间点将内存数据快照保存到磁盘（`.rdb` 文件）。

```bash
# 触发方式
SAVE          # 同步，阻塞主线程
BGSAVE        # 异步，fork 子进程生成快照（推荐）

# 自动触发配置
save 900 1    # 900秒内有1次修改
save 300 10   # 300秒内有10次修改
save 60 10000 # 60秒内有10000次修改

# fork + COW（写时复制）
# 子进程共享父进程内存页，写操作时才复制对应页
# 优点：快照期间父进程可以继续处理请求
```

**优缺点**：
- 优点：文件紧凑，恢复速度快；适合备份和灾难恢复
- 缺点：可能丢失最后一次快照后的数据；fork 时内存占用翻倍

### 2.2 AOF（Append Only File）

**原理**：记录每条写命令，重启时重放命令恢复数据。

```bash
# 同步策略
appendfsync always    # 每次写命令都同步（最安全，最慢）
appendfsync everysec  # 每秒同步一次（推荐，最多丢1秒数据）
appendfsync no        # 由 OS 决定（最快，可能丢较多数据）

# AOF 重写（压缩 AOF 文件）
BGREWRITEAOF          # 手动触发
auto-aof-rewrite-percentage 100  # AOF 文件增长100%时自动重写
auto-aof-rewrite-min-size 64mb   # AOF 文件最小64MB才重写
```

**AOF 重写原理**：fork 子进程，遍历内存数据生成最小化命令集（如 `LPUSH list a b c` 替代多条 `LPUSH`），同时主进程的新写命令写入 AOF 重写缓冲区，重写完成后追加到新 AOF 文件。

### 2.3 混合持久化（Redis 4.0+）

```bash
aof-use-rdb-preamble yes  # 开启混合持久化

# AOF 文件结构：
# [RDB 快照数据] + [增量 AOF 命令]
# 重启时：先加载 RDB 快照，再重放增量 AOF 命令
# 优点：恢复速度快（RDB）+ 数据完整性高（AOF）
```

### 2.4 RDB vs AOF 对比

| 维度 | RDB | AOF |
|------|-----|-----|
| 文件大小 | 小（二进制压缩） | 大（文本命令） |
| 恢复速度 | 快 | 慢（需重放命令） |
| 数据安全 | 低（可能丢失分钟级数据） | 高（最多丢1秒） |
| 性能影响 | fork 时内存翻倍 | 每秒 fsync 有 IO 开销 |
| 适用场景 | 备份、容灾 | 数据安全要求高 |

---

## 3. 内存淘汰策略

```bash
# 配置最大内存
maxmemory 4gb
maxmemory-policy allkeys-lru  # 淘汰策略
```

| 策略 | 说明 | 适用场景 |
|------|------|----------|
| `noeviction` | 不淘汰，写入报错 | 不允许丢数据 |
| `allkeys-lru` | 所有 key 中 LRU | 通用缓存 |
| `volatile-lru` | 有过期时间的 key 中 LRU | 混合存储 |
| `allkeys-lfu` | 所有 key 中 LFU（Redis 4.0+） | 热点数据明显 |
| `volatile-lfu` | 有过期时间的 key 中 LFU | - |
| `allkeys-random` | 随机淘汰 | 均匀访问 |
| `volatile-random` | 有过期时间的 key 中随机 | - |
| `volatile-ttl` | 淘汰剩余 TTL 最短的 key | - |

**LRU 近似实现**：Redis 不使用精确 LRU（需要链表，内存开销大），而是随机采样 N 个 key（默认5个），淘汰其中最久未访问的。

---

## 4. 高可用方案

### 4.1 主从复制

```bash
# 从节点配置
replicaof 192.168.1.1 6379

# 复制流程
# 1. 全量复制：从节点发送 PSYNC，主节点 BGSAVE 生成 RDB，发送给从节点
# 2. 增量复制：主节点将写命令写入 repl_backlog（环形缓冲区），从节点断线重连后同步
```

### 4.2 哨兵（Sentinel）

**功能**：监控主从节点、自动故障转移、通知客户端

```
哨兵集群（奇数个，至少3个）
    ↓ 监控
主节点 → 从节点1
       → 从节点2

故障转移流程：
1. 哨兵发现主节点不可达（主观下线）
2. 超过 quorum 个哨兵认为主节点不可达（客观下线）
3. 哨兵选举 Leader（Raft 算法）
4. Leader 选择最优从节点（复制偏移量最大）升级为主节点
5. 其他从节点指向新主节点
6. 通知客户端新主节点地址
```

### 4.3 Redis Cluster ⭐

**数据分片**：将数据分散到 16384 个哈希槽（Hash Slot）

```
hash_slot = CRC16(key) % 16384

集群示例（3主3从）：
节点1：槽 0~5460
节点2：槽 5461~10922
节点3：槽 10923~16383
每个主节点有一个从节点（高可用）
```

**集群特性**：
- 去中心化，无代理
- 客户端直连数据节点
- 节点间通过 Gossip 协议通信
- 支持在线扩缩容（槽迁移）

**MOVED 重定向**：

```
客户端 → 节点1（key 不在节点1）
节点1 → 返回 MOVED 5678 192.168.1.2:6379
客户端 → 节点2（直接访问正确节点）
```

**Cluster 限制**：
- 不支持跨节点的多 key 操作（MGET/MSET 需要 key 在同一槽）
- 使用 `{}` 哈希标签保证相关 key 在同一槽：`{user:1}:name`、`{user:1}:age`

---

## 5. 分布式锁实现 ⭐

### 5.1 基础实现

```java
// SET NX PX 原子命令（Redis 2.6.12+）
String result = jedis.set(
    lockKey,           // key
    requestId,         // value（唯一标识，用于释放时验证）
    SetParams.setParams().nx().px(30000)  // NX=不存在才设置，PX=过期时间(ms)
);

if ("OK".equals(result)) {
    // 获取锁成功
    try {
        // 业务逻辑
    } finally {
        // 释放锁（Lua 脚本保证原子性）
        String script = 
            "if redis.call('get', KEYS[1]) == ARGV[1] then " +
            "    return redis.call('del', KEYS[1]) " +
            "else " +
            "    return 0 " +
            "end";
        jedis.eval(script, Collections.singletonList(lockKey), 
                   Collections.singletonList(requestId));
    }
}
```

### 5.2 Redisson 分布式锁

```java
// Redisson 提供了完整的分布式锁实现
RLock lock = redissonClient.getLock("myLock");

// 自动续期（看门狗机制）：默认30秒，每10秒续期一次
lock.lock();

// 指定过期时间（不自动续期）
lock.lock(10, TimeUnit.SECONDS);

// 尝试获取锁（带超时）
boolean acquired = lock.tryLock(3, 10, TimeUnit.SECONDS);

try {
    // 业务逻辑
} finally {
    lock.unlock();
}

// 可重入锁
lock.lock();
lock.lock();  // 同一线程可重入
lock.unlock();
lock.unlock();
```

**看门狗机制**：Redisson 在获取锁后启动一个后台线程，每隔 `lockWatchdogTimeout/3`（默认10秒）检查锁是否还被持有，如果是则续期。

### 5.3 RedLock 算法

**问题**：单节点 Redis 宕机后，锁可能丢失。

**RedLock**：在 N 个独立 Redis 节点上获取锁，超过 N/2+1 个成功才算获取成功。

```java
// Redisson RedLock（已废弃，不推荐）
RLock lock1 = redissonClient1.getLock("myLock");
RLock lock2 = redissonClient2.getLock("myLock");
RLock lock3 = redissonClient3.getLock("myLock");

RedissonRedLock redLock = new RedissonRedLock(lock1, lock2, lock3);
redLock.lock();
```

> ⚠️ **注意**：RedLock 存在争议（Martin Kleppmann 的批评），在时钟漂移、GC 停顿等场景下可能失效。生产中更推荐使用 Redisson 的普通分布式锁 + Redis 主从高可用。

---

## 6. 缓存三大问题 ⭐

### 6.1 缓存穿透

**问题**：查询不存在的数据，每次都打到数据库。

```java
// 解决方案1：缓存空值
String value = redis.get(key);
if (value == null) {
    value = db.query(key);
    if (value == null) {
        redis.setex(key, 60, "NULL");  // 缓存空值，短过期时间
    } else {
        redis.setex(key, 3600, value);
    }
}
return "NULL".equals(value) ? null : value;

// 解决方案2：布隆过滤器（推荐）
// 初始化时将所有合法 key 加入布隆过滤器
BloomFilter<String> bloomFilter = BloomFilter.create(
    Funnels.stringFunnel(Charset.defaultCharset()), 
    1000000,  // 预期元素数量
    0.01      // 误判率
);

// 查询前先检查布隆过滤器
if (!bloomFilter.mightContain(key)) {
    return null;  // 一定不存在，直接返回
}
// 可能存在，继续查询缓存和数据库
```

### 6.2 缓存击穿

**问题**：热点 key 过期瞬间，大量请求同时打到数据库。

```java
// 解决方案1：互斥锁（同时只有一个请求重建缓存）
String value = redis.get(key);
if (value == null) {
    String lockKey = "lock:" + key;
    if (redis.setnx(lockKey, "1")) {
        redis.expire(lockKey, 10);
        try {
            value = db.query(key);
            redis.setex(key, 3600, value);
        } finally {
            redis.del(lockKey);
        }
    } else {
        Thread.sleep(50);
        return get(key);  // 重试
    }
}
return value;

// 解决方案2：逻辑过期（不设置真实过期时间）
class CacheValue {
    String data;
    long expireTime;  // 逻辑过期时间
}

String value = redis.get(key);
CacheValue cv = JSON.parse(value, CacheValue.class);
if (cv.expireTime < System.currentTimeMillis()) {
    // 异步重建缓存
    executor.submit(() -> {
        String newData = db.query(key);
        redis.set(key, JSON.toJSON(new CacheValue(newData, 
            System.currentTimeMillis() + 3600000)));
    });
}
return cv.data;  // 返回旧数据（允许短暂不一致）
```

### 6.3 缓存雪崩

**问题**：大量 key 同时过期，或 Redis 宕机，导致大量请求打到数据库。

```java
// 解决方案1：随机过期时间（避免同时过期）
int baseExpire = 3600;
int randomExpire = new Random().nextInt(600);  // 随机0~600秒
redis.setex(key, baseExpire + randomExpire, value);

// 解决方案2：多级缓存（本地缓存 + Redis）
// 本地缓存（Caffeine/Guava Cache）作为第一级
// Redis 作为第二级
// 即使 Redis 宕机，本地缓存仍可提供服务

// 解决方案3：熔断降级
// Redis 不可用时，熔断器打开，直接返回默认值或降级数据
// 避免雪崩效应传导到数据库

// 解决方案4：Redis 高可用（哨兵/Cluster）
// 避免单点故障导致的雪崩
```

---

## 7. Redis 事务与 Lua 脚本

### 7.1 Redis 事务

```bash
MULTI          # 开启事务
SET key1 v1    # 命令入队
SET key2 v2    # 命令入队
EXEC           # 执行事务

DISCARD        # 取消事务

# 注意：Redis 事务不支持回滚！
# 语法错误：整个事务不执行
# 运行时错误：其他命令继续执行（不回滚）
```

### 7.2 Lua 脚本（推荐）

```lua
-- 原子性操作：检查并设置（CAS）
local current = redis.call('GET', KEYS[1])
if current == ARGV[1] then
    redis.call('SET', KEYS[1], ARGV[2])
    return 1
else
    return 0
end
```

```java
// Java 调用 Lua 脚本
String script = "...";
jedis.eval(script, 
    Arrays.asList("myKey"),           // KEYS
    Arrays.asList("oldValue", "newValue")  // ARGV
);
```

---

## 8. 热点 key 与大 key 处理方案

### 8.1 热点 key

**问题**：某个 key 访问量极高，单节点 Redis 成为瓶颈。

```java
// 解决方案1：本地缓存（L1 缓存）
// 使用 Caffeine 在应用层缓存热点数据
Cache<String, String> localCache = Caffeine.newBuilder()
    .maximumSize(1000)
    .expireAfterWrite(10, TimeUnit.SECONDS)
    .build();

// 解决方案2：key 分散（读写分离）
// 将热点 key 复制到多个 key：hotKey_0, hotKey_1, ..., hotKey_N
// 读取时随机选择一个
String key = "hotKey_" + ThreadLocalRandom.current().nextInt(10);
String value = redis.get(key);

// 解决方案3：Redis Cluster 多副本
// 将热点 key 分散到不同节点
```

### 8.2 大 key

**问题**：单个 key 的 value 过大（String > 10KB，集合元素 > 5000），导致网络传输慢、内存分配慢、删除时阻塞。

```bash
# 发现大 key
redis-cli --bigkeys                    # 扫描大 key
redis-cli -h host -p port --bigkeys

# 分析 RDB 文件
rdb --command memory dump.rdb | sort -t ',' -k 4 -rn | head -20

# 解决方案
# 1. 拆分大 key：将大 Hash 拆分为多个小 Hash
#    user:1:base（基本信息）、user:1:ext（扩展信息）

# 2. 压缩 value：使用 gzip/snappy 压缩

# 3. 异步删除大 key（避免阻塞）
UNLINK key  # 异步删除（Redis 4.0+）
# 而非 DEL key（同步删除，可能阻塞）
```

---

## 高频面试真题

### Q1：Redis 为什么这么快？

**答题框架**：
- 纯内存操作，避免磁盘 IO
- 单线程模型（命令处理），避免线程切换和锁竞争（Redis 6.0 网络 IO 多线程）
- IO 多路复用（epoll），高效处理并发连接
- 高效的数据结构（SDS/ziplist/skiplist）
- 简单的协议（RESP），解析高效

### Q2：Redis 持久化方案如何选择？

**答题框架**：
- 纯缓存（允许丢数据）：关闭持久化
- 数据安全要求高：AOF（everysec）
- 快速恢复：RDB 或混合持久化
- 生产推荐：混合持久化（aof-use-rdb-preamble yes）+ AOF everysec

### Q3：如何实现一个可靠的分布式锁？

**答题框架**：
- 基础：SET NX PX + Lua 脚本释放（原子性）
- 可重入：Redisson（Hash 结构存储重入次数）
- 自动续期：Redisson 看门狗机制
- 高可用：Redis 主从 + 哨兵；或 RedLock（有争议）
- 注意事项：锁超时时间要大于业务执行时间；释放时验证 requestId

### Q4：缓存穿透、击穿、雪崩的区别和解决方案？

**答题框架**：
- 穿透：查询不存在的 key → 布隆过滤器 / 缓存空值
- 击穿：热点 key 过期 → 互斥锁 / 逻辑过期
- 雪崩：大量 key 同时过期 / Redis 宕机 → 随机过期时间 / 多级缓存 / 高可用

### Q5：Redis Cluster 的数据分片原理？

**答题框架**：
- 16384 个哈希槽，CRC16(key) % 16384 确定槽位
- 每个主节点负责一部分槽，从节点备份
- 客户端直连，MOVED 重定向到正确节点
- 哈希标签 `{}` 保证相关 key 在同一槽
- 扩容：槽迁移，在线完成，不影响服务

---

## 学习建议

**备考重点**：数据类型底层编码（必考）、持久化对比（必考）、分布式锁（必考）、缓存三大问题（必考）、Cluster 原理（必考）

**推荐资源**：
- 《Redis 设计与实现》（黄健宏）
- Redis 官方文档：https://redis.io/docs/
- Redisson 官方文档：https://redisson.org/
- 极客时间《Redis 核心技术与实战》（蒋德钧）
