# 模块十：DDD 领域驱动设计 💡

> 加分项，体现架构思维深度，P7 及以上岗位高频考点

---

## 1. DDD 核心概念

### 1.1 为什么需要 DDD？

传统开发的问题：
- **贫血模型**：Service 层承载所有业务逻辑，领域对象只有 getter/setter
- **大泥球**：随着业务增长，代码耦合严重，难以维护
- **技术驱动**：以数据库表结构为中心设计，而非业务

DDD 的价值：
- **业务驱动**：以领域模型为核心，代码反映业务语言
- **边界清晰**：限界上下文划分服务边界
- **可维护性**：聚合根保护业务不变量，领域事件解耦

### 1.2 战略设计 vs 战术设计

```
战略设计（宏观）：
├── 领域（Domain）：整个业务范围
├── 子域（Subdomain）：业务的子领域
│   ├── 核心域（Core Domain）：竞争优势所在，重点投入
│   ├── 支撑域（Supporting Domain）：支撑核心域，可自研
│   └── 通用域（Generic Domain）：通用能力，可购买/外包
└── 限界上下文（Bounded Context）：模型的边界

战术设计（微观）：
├── 实体（Entity）
├── 值对象（Value Object）
├── 聚合（Aggregate）& 聚合根（Aggregate Root）
├── 领域服务（Domain Service）
├── 领域事件（Domain Event）
├── 仓储（Repository）
└── 工厂（Factory）
```

---

## 2. 战略设计

### 2.1 限界上下文（Bounded Context）⭐

限界上下文是**模型的边界**，同一个词在不同上下文中有不同含义。

```
电商系统的限界上下文划分：

用户上下文（User Context）
    - 用户：注册信息、登录状态、权限

订单上下文（Order Context）
    - 用户：下单人（只关心 userId、userName）
    - 商品：订单中的商品（只关心 productId、name、price）

商品上下文（Product Context）
    - 商品：详细信息、库存、分类

支付上下文（Payment Context）
    - 订单：支付金额、支付状态

物流上下文（Logistics Context）
    - 订单：收货地址、商品重量
```

### 2.2 上下文映射（Context Mapping）

```
上下文间的关系模式：

合作关系（Partnership）：两个上下文紧密合作，共同演进

共享内核（Shared Kernel）：共享部分模型（谨慎使用）

客户-供应商（Customer-Supplier）：
    下游（客户）依赖上游（供应商）
    上游需要考虑下游需求

遵奉者（Conformist）：
    下游完全遵从上游模型（上游不关心下游）

防腐层（Anti-Corruption Layer，ACL）：⭐
    下游通过翻译层隔离上游模型的变化
    避免上游的"腐烂"传染到下游

开放主机服务（Open Host Service）：
    提供标准化 API，供多个下游使用

发布语言（Published Language）：
    使用标准化语言（如 JSON Schema）交换数据
```

**防腐层实现**：

```java
// 外部系统（上游）的用户模型
public class ExternalUser {
    private String userId;
    private String fullName;
    private String emailAddress;
    private int userType;  // 1=普通用户, 2=VIP
}

// 防腐层：将外部模型转换为领域模型
@Component
public class UserAntiCorruptionLayer {
    
    public User translate(ExternalUser externalUser) {
        return User.builder()
            .id(UserId.of(externalUser.getUserId()))
            .name(UserName.of(externalUser.getFullName()))
            .email(Email.of(externalUser.getEmailAddress()))
            .level(externalUser.getUserType() == 2 ? UserLevel.VIP : UserLevel.NORMAL)
            .build();
    }
}
```

---

## 3. 战术设计

### 3.1 实体（Entity）

**特征**：有唯一标识，通过标识判断相等，有生命周期，状态可变。

```java
// 实体：有唯一 ID，通过 ID 判断相等
public class Order {
    private final OrderId id;  // 唯一标识
    private OrderStatus status;
    private List<OrderItem> items;
    private Money totalAmount;
    
    // 通过 ID 判断相等
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Order)) return false;
        Order order = (Order) o;
        return Objects.equals(id, order.id);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
```

### 3.2 值对象（Value Object）

**特征**：无唯一标识，通过属性值判断相等，不可变，可替换。

```java
// 值对象：不可变，通过属性值判断相等
public final class Money {
    private final BigDecimal amount;
    private final Currency currency;
    
    public Money(BigDecimal amount, Currency currency) {
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("金额不能为负");
        }
        this.amount = amount;
        this.currency = currency;
    }
    
    // 值对象的操作返回新对象（不可变）
    public Money add(Money other) {
        if (!this.currency.equals(other.currency)) {
            throw new IllegalArgumentException("货币类型不一致");
        }
        return new Money(this.amount.add(other.amount), this.currency);
    }
    
    // 通过属性值判断相等
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Money)) return false;
        Money money = (Money) o;
        return Objects.equals(amount, money.amount) && 
               Objects.equals(currency, money.currency);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(amount, currency);
    }
}

// 其他值对象示例
public final class Address {
    private final String province;
    private final String city;
    private final String district;
    private final String detail;
}

public final class Email {
    private final String value;
    
    public Email(String value) {
        if (!value.matches("^[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}$")) {
            throw new IllegalArgumentException("邮箱格式不正确: " + value);
        }
        this.value = value;
    }
}
```

### 3.3 聚合根（Aggregate Root）⭐

**聚合**：一组相关对象的集合，有一个聚合根作为入口。

**聚合根设计原则**：
1. 通过聚合根访问聚合内的对象（外部不直接持有内部对象引用）
2. 聚合内保持强一致性，聚合间最终一致性
3. 聚合尽量小（减少锁竞争）
4. 聚合根负责维护业务不变量

```java
// 订单聚合根
public class Order {
    private final OrderId id;
    private OrderStatus status;
    private final CustomerId customerId;
    private final List<OrderItem> items;  // 聚合内的实体
    private Money totalAmount;
    private final List<DomainEvent> domainEvents = new ArrayList<>();
    
    // 工厂方法（替代构造函数）
    public static Order create(CustomerId customerId, List<OrderItemCommand> itemCommands) {
        if (itemCommands.isEmpty()) {
            throw new DomainException("订单至少包含一个商品");
        }
        Order order = new Order(OrderId.generate(), customerId);
        itemCommands.forEach(cmd -> order.addItem(cmd.getProductId(), cmd.getQuantity(), cmd.getPrice()));
        order.calculateTotal();
        order.addDomainEvent(new OrderCreatedEvent(order.id, order.customerId));
        return order;
    }
    
    // 业务方法（包含业务规则）
    public void pay(PaymentInfo payment) {
        if (status != OrderStatus.PENDING) {
            throw new DomainException("只有待支付订单才能支付，当前状态: " + status);
        }
        if (!payment.getAmount().equals(totalAmount)) {
            throw new DomainException("支付金额不匹配");
        }
        this.status = OrderStatus.PAID;
        addDomainEvent(new OrderPaidEvent(id, payment));
    }
    
    public void cancel(String reason) {
        if (status == OrderStatus.SHIPPED || status == OrderStatus.COMPLETED) {
            throw new DomainException("已发货或已完成的订单不能取消");
        }
        this.status = OrderStatus.CANCELLED;
        addDomainEvent(new OrderCancelledEvent(id, reason));
    }
    
    // 内部方法，外部不直接操作 items
    private void addItem(ProductId productId, int quantity, Money price) {
        // 检查是否已有相同商品
        items.stream()
            .filter(item -> item.getProductId().equals(productId))
            .findFirst()
            .ifPresentOrElse(
                item -> item.increaseQuantity(quantity),
                () -> items.add(new OrderItem(productId, quantity, price))
            );
    }
    
    private void calculateTotal() {
        this.totalAmount = items.stream()
            .map(OrderItem::getSubtotal)
            .reduce(Money.ZERO, Money::add);
    }
    
    // 领域事件
    private void addDomainEvent(DomainEvent event) {
        domainEvents.add(event);
    }
    
    public List<DomainEvent> getDomainEvents() {
        return Collections.unmodifiableList(domainEvents);
    }
    
    public void clearDomainEvents() {
        domainEvents.clear();
    }
}
```

### 3.4 领域服务（Domain Service）

**适用场景**：业务逻辑不属于任何单一实体或值对象时，放入领域服务。

```java
// 转账领域服务（涉及两个账户聚合）
public class TransferDomainService {
    
    public void transfer(Account from, Account to, Money amount) {
        // 业务规则：转账双方不能是同一账户
        if (from.getId().equals(to.getId())) {
            throw new DomainException("不能向自己转账");
        }
        
        from.debit(amount);   // 扣款
        to.credit(amount);    // 入账
    }
}
```

### 3.5 领域事件（Domain Event）

```java
// 领域事件：记录领域中发生的重要事情
public class OrderPaidEvent implements DomainEvent {
    private final OrderId orderId;
    private final CustomerId customerId;
    private final Money amount;
    private final Instant occurredOn;
    
    public OrderPaidEvent(OrderId orderId, CustomerId customerId, Money amount) {
        this.orderId = orderId;
        this.customerId = customerId;
        this.amount = amount;
        this.occurredOn = Instant.now();
    }
}

// 领域事件处理（应用层）
@Component
public class OrderPaidEventHandler {
    
    @EventHandler
    public void handle(OrderPaidEvent event) {
        // 触发后续流程（解耦）
        inventoryService.confirmReservation(event.getOrderId());
        notificationService.sendPaymentConfirmation(event.getCustomerId());
        loyaltyService.addPoints(event.getCustomerId(), event.getAmount());
    }
}
```

### 3.6 仓储（Repository）

```java
// 仓储接口（领域层定义，基础设施层实现）
public interface OrderRepository {
    Order findById(OrderId id);
    void save(Order order);
    void delete(OrderId id);
    List<Order> findByCustomerId(CustomerId customerId);
}

// 仓储实现（基础设施层）
@Repository
public class OrderRepositoryImpl implements OrderRepository {
    
    @Autowired
    private OrderMapper orderMapper;  // MyBatis Mapper
    
    @Override
    public Order findById(OrderId id) {
        OrderPO po = orderMapper.selectById(id.getValue());
        return OrderConverter.toDomain(po);  // PO → 领域对象
    }
    
    @Override
    public void save(Order order) {
        OrderPO po = OrderConverter.toPO(order);  // 领域对象 → PO
        if (orderMapper.selectById(po.getId()) == null) {
            orderMapper.insert(po);
        } else {
            orderMapper.update(po);
        }
        // 发布领域事件
        order.getDomainEvents().forEach(eventPublisher::publish);
        order.clearDomainEvents();
    }
}
```

---

## 4. DDD 分层架构

```
┌─────────────────────────────────────────┐
│           用户接口层（UI Layer）           │
│   Controller、DTO、Assembler             │
├─────────────────────────────────────────┤
│           应用层（Application Layer）     │
│   ApplicationService、Command、Query     │
│   事务管理、权限校验、领域事件发布          │
├─────────────────────────────────────────┤
│           领域层（Domain Layer）          │
│   Entity、ValueObject、AggregateRoot     │
│   DomainService、DomainEvent             │
│   Repository 接口                        │
├─────────────────────────────────────────┤
│         基础设施层（Infrastructure Layer）│
│   Repository 实现、MQ、缓存、外部服务      │
└─────────────────────────────────────────┘
```

**各层职责**：

```java
// 用户接口层：接收请求，转换 DTO
@RestController
public class OrderController {
    @Autowired
    private CreateOrderCommandHandler handler;
    
    @PostMapping("/orders")
    public OrderResponse createOrder(@RequestBody CreateOrderRequest request) {
        CreateOrderCommand command = OrderAssembler.toCommand(request);
        OrderId orderId = handler.handle(command);
        return new OrderResponse(orderId.getValue());
    }
}

// 应用层：编排领域对象，管理事务
@Service
@Transactional
public class CreateOrderCommandHandler {
    @Autowired
    private OrderRepository orderRepository;
    @Autowired
    private ProductRepository productRepository;
    
    public OrderId handle(CreateOrderCommand command) {
        // 1. 查询商品信息（领域对象）
        List<Product> products = command.getItems().stream()
            .map(item -> productRepository.findById(item.getProductId()))
            .collect(Collectors.toList());
        
        // 2. 创建订单（领域逻辑）
        Order order = Order.create(command.getCustomerId(), 
                                   buildOrderItems(command.getItems(), products));
        
        // 3. 保存（仓储）
        orderRepository.save(order);
        
        return order.getId();
    }
}

// 领域层：纯业务逻辑，不依赖任何框架
public class Order {
    // 见上方聚合根示例
}
```

---

## 5. CQRS + Event Sourcing

### 5.1 CQRS（命令查询职责分离）

```
传统架构：读写使用同一模型
CQRS：读写分离，使用不同模型

写模型（Command Side）：
- 接收命令（CreateOrder、PayOrder）
- 执行业务逻辑，更新状态
- 发布领域事件

读模型（Query Side）：
- 接收查询（GetOrderDetail、ListOrders）
- 从读库（可能是 ES/Redis/只读 DB）查询
- 返回 DTO（针对 UI 优化的数据结构）

优点：
- 读写分别优化（读可以用 ES/Redis，写用 MySQL）
- 读模型可以有多个（不同 UI 需要不同视图）
- 写模型简单，专注业务逻辑

缺点：
- 复杂度增加
- 读写数据存在短暂不一致（最终一致性）
```

```java
// 命令处理
@CommandHandler
public class CreateOrderHandler {
    public OrderId handle(CreateOrderCommand command) {
        Order order = Order.create(...);
        orderRepository.save(order);
        return order.getId();
    }
}

// 查询处理（直接查询读库，不经过领域模型）
@QueryHandler
public class GetOrderDetailHandler {
    @Autowired
    private OrderReadRepository readRepository;  // 读库（可能是 ES）
    
    public OrderDetailDTO handle(GetOrderDetailQuery query) {
        return readRepository.findDetailById(query.getOrderId());
    }
}

// 事件处理器：更新读模型
@EventHandler
public class OrderReadModelUpdater {
    
    public void on(OrderCreatedEvent event) {
        // 将订单信息写入读库（ES/Redis）
        OrderReadModel model = new OrderReadModel(event);
        readRepository.save(model);
    }
    
    public void on(OrderPaidEvent event) {
        readRepository.updateStatus(event.getOrderId(), "PAID");
    }
}
```

### 5.2 Event Sourcing（事件溯源）

```java
// 不存储当前状态，而是存储所有事件
// 当前状态 = 重放所有历史事件

public class Order {
    private OrderId id;
    private OrderStatus status;
    private List<OrderItem> items;
    
    // 从事件重建状态
    public static Order reconstitute(List<DomainEvent> events) {
        Order order = new Order();
        events.forEach(order::apply);
        return order;
    }
    
    private void apply(DomainEvent event) {
        if (event instanceof OrderCreatedEvent) {
            apply((OrderCreatedEvent) event);
        } else if (event instanceof OrderPaidEvent) {
            apply((OrderPaidEvent) event);
        }
    }
    
    private void apply(OrderCreatedEvent event) {
        this.id = event.getOrderId();
        this.status = OrderStatus.PENDING;
        this.items = event.getItems();
    }
    
    private void apply(OrderPaidEvent event) {
        this.status = OrderStatus.PAID;
    }
}

// 事件存储
public interface EventStore {
    void append(String aggregateId, List<DomainEvent> events, int expectedVersion);
    List<DomainEvent> load(String aggregateId);
    List<DomainEvent> load(String aggregateId, int fromVersion);
}
```

**Event Sourcing 优点**：完整审计日志、时间旅行（回到任意时间点的状态）、事件驱动天然解耦

**Event Sourcing 缺点**：查询复杂（需要 CQRS 配合）、事件 schema 演化困难、性能（重放大量事件）

---

## 6. DDD 落地案例分析

### 6.1 电商订单系统

```
领域划分：
- 核心域：订单（竞争优势）
- 支撑域：库存、物流
- 通用域：用户、支付（可购买第三方）

订单限界上下文内的聚合：
- 订单聚合（Order）：订单 + 订单项
- 购物车聚合（Cart）：购物车 + 购物车项

聚合间通过领域事件解耦：
OrderCreated → 库存服务扣减库存
OrderPaid → 物流服务创建发货单
OrderCancelled → 库存服务释放库存
```

### 6.2 DDD 与微服务的结合

```
一个限界上下文 ≈ 一个微服务（理想情况）

但实际中：
- 初期：一个服务包含多个限界上下文（单体）
- 成长期：按限界上下文拆分微服务
- 成熟期：每个微服务对应一个限界上下文

拆分时机：
- 团队规模增长，协作成本高
- 某个模块需要独立扩展
- 技术栈需要差异化
```

---

## 高频面试真题

### Q1：什么是 DDD？为什么要用 DDD？

**答题框架**：
- DDD 是以领域模型为核心的软件设计方法，强调业务驱动而非技术驱动
- 解决的问题：贫血模型（业务逻辑散落在 Service）、大泥球（随业务增长代码腐化）
- 核心价值：限界上下文划清边界、聚合根保护业务不变量、领域事件解耦
- 适用场景：复杂业务领域（电商、金融），简单 CRUD 不需要 DDD

### Q2：聚合根的设计原则是什么？

**答题框架**：
- 通过聚合根访问聚合内对象（外部不直接持有内部引用）
- 聚合内强一致性，聚合间最终一致性（通过领域事件）
- 聚合尽量小（减少锁竞争，提高并发）
- 聚合根负责维护业务不变量（在方法中检查业务规则）
- 实体 vs 值对象：有唯一标识用实体，无标识用值对象（不可变）

### Q3：CQRS 模式是什么？适用场景？

**答题框架**：
- 命令（写）和查询（读）使用不同模型，分别优化
- 写模型：领域模型，保证业务一致性
- 读模型：针对 UI 优化的 DTO，可以用 ES/Redis 存储
- 适用场景：读写比例差异大、读模型复杂（多种视图）、需要高性能查询
- 缺点：复杂度增加，读写短暂不一致

### Q4：DDD 中的防腐层是什么？

**答题框架**：
- 防腐层（ACL）：隔离外部系统（上游）对本系统（下游）的影响
- 通过翻译层将外部模型转换为本系统的领域模型
- 避免外部系统的变化直接影响本系统
- 实现：Adapter + Translator，将外部 DTO 转换为领域对象

### Q5：如何在实际项目中落地 DDD？

**答题框架**：
- 事件风暴（Event Storming）：与业务专家共同梳理领域事件、命令、聚合
- 识别限界上下文：按业务能力划分，确定上下文边界
- 战术设计：识别聚合根、实体、值对象，定义领域服务
- 分层架构：用户接口层 → 应用层 → 领域层 → 基础设施层
- 渐进式落地：不必一开始就完全 DDD，可以从核心域开始

---

## 学习建议

**备考重点**：限界上下文（必考）、聚合根设计（必考）、CQRS（高频）、DDD 与微服务结合（高频）

**推荐资源**：
- 《领域驱动设计》（Eric Evans）—— DDD 原著
- 《实现领域驱动设计》（Vaughn Vernon）—— 实践指南
- 《领域驱动设计精粹》（Vaughn Vernon）—— 入门首选
- 极客时间《DDD 实战课》（欧创新）
- 美团技术博客：DDD 在美团的实践
