# 模块八：设计模式

> 代码设计能力的体现，P6/P7 需要能结合实际项目讲解

---

## 1. 六大设计原则（SOLID + 迪米特）

| 原则 | 说明 | 核心思想 |
|------|------|----------|
| **S** 单一职责（SRP） | 一个类只负责一件事 | 高内聚，低耦合 |
| **O** 开闭原则（OCP） | 对扩展开放，对修改关闭 | 用抽象定义结构，用实现扩展细节 |
| **L** 里氏替换（LSP） | 子类可以替换父类 | 继承时不改变父类行为 |
| **I** 接口隔离（ISP） | 接口要小而专，不强迫实现不需要的方法 | 细化接口 |
| **D** 依赖倒置（DIP） | 高层模块不依赖低层模块，都依赖抽象 | 面向接口编程 |
| 迪米特法则（LoD） | 只与直接朋友通信 | 减少对象间耦合 |

---

## 2. 创建型模式

### 2.1 单例模式 ⭐

```java
// 方式1：双重检查锁（DCL）
public class Singleton {
    private volatile static Singleton instance;
    
    private Singleton() {}
    
    public static Singleton getInstance() {
        if (instance == null) {
            synchronized (Singleton.class) {
                if (instance == null) {
                    instance = new Singleton();
                }
            }
        }
        return instance;
    }
}

// 方式2：静态内部类（推荐）
// 利用类加载机制保证线程安全，延迟加载
public class Singleton {
    private Singleton() {}
    
    private static class Holder {
        private static final Singleton INSTANCE = new Singleton();
    }
    
    public static Singleton getInstance() {
        return Holder.INSTANCE;
    }
}

// 方式3：枚举（最简洁，防反射/序列化攻击）
public enum Singleton {
    INSTANCE;
    
    public void doSomething() { ... }
}
// 使用：Singleton.INSTANCE.doSomething()
```

**Spring 中的单例**：Spring Bean 默认是单例，但通过 IoC 容器管理，不是传统意义的单例模式（可以有多个容器）。

### 2.2 工厂模式

```java
// 简单工厂（非 GoF 模式）
public class PaymentFactory {
    public static Payment create(String type) {
        return switch (type) {
            case "alipay" -> new AlipayPayment();
            case "wechat" -> new WechatPayment();
            default -> throw new IllegalArgumentException("Unknown type: " + type);
        };
    }
}

// 工厂方法模式：每种产品对应一个工厂
public interface PaymentFactory {
    Payment create();
}

public class AlipayFactory implements PaymentFactory {
    @Override
    public Payment create() { return new AlipayPayment(); }
}

// 抽象工厂模式：创建一族相关产品
public interface UIFactory {
    Button createButton();
    TextField createTextField();
}

public class MacUIFactory implements UIFactory {
    @Override
    public Button createButton() { return new MacButton(); }
    @Override
    public TextField createTextField() { return new MacTextField(); }
}
```

### 2.3 建造者模式

```java
// 适用：构造参数多，部分可选
public class HttpRequest {
    private final String url;
    private final String method;
    private final Map<String, String> headers;
    private final String body;
    private final int timeout;
    
    private HttpRequest(Builder builder) {
        this.url = builder.url;
        this.method = builder.method;
        this.headers = builder.headers;
        this.body = builder.body;
        this.timeout = builder.timeout;
    }
    
    public static class Builder {
        private String url;
        private String method = "GET";
        private Map<String, String> headers = new HashMap<>();
        private String body;
        private int timeout = 3000;
        
        public Builder url(String url) { this.url = url; return this; }
        public Builder method(String method) { this.method = method; return this; }
        public Builder header(String key, String value) { 
            this.headers.put(key, value); return this; 
        }
        public Builder body(String body) { this.body = body; return this; }
        public Builder timeout(int timeout) { this.timeout = timeout; return this; }
        
        public HttpRequest build() {
            Objects.requireNonNull(url, "url is required");
            return new HttpRequest(this);
        }
    }
}

// 使用
HttpRequest request = new HttpRequest.Builder()
    .url("https://api.example.com/users")
    .method("POST")
    .header("Content-Type", "application/json")
    .body("{\"name\":\"张三\"}")
    .timeout(5000)
    .build();
```

---

## 3. 结构型模式

### 3.1 代理模式

```java
// 静态代理
public class LoggingUserService implements UserService {
    private final UserService delegate;
    
    public LoggingUserService(UserService delegate) {
        this.delegate = delegate;
    }
    
    @Override
    public User getUser(Long id) {
        log.info("Getting user: {}", id);
        User user = delegate.getUser(id);
        log.info("Got user: {}", user);
        return user;
    }
}

// 动态代理（见模块一）
// Spring AOP 本质是代理模式
```

### 3.2 装饰器模式

```java
// 与代理模式的区别：
// 代理：控制访问，代理类通常自己创建被代理对象
// 装饰器：增强功能，装饰器接收被装饰对象（外部传入）

// Java IO 中的装饰器
InputStream is = new BufferedInputStream(
    new GZIPInputStream(
        new FileInputStream("file.gz")
    )
);

// 自定义装饰器
public interface Cache {
    Object get(String key);
    void put(String key, Object value);
}

// 基础实现
public class SimpleCache implements Cache { ... }

// 装饰器：添加统计功能
public class StatisticsCache implements Cache {
    private final Cache delegate;
    private final AtomicLong hitCount = new AtomicLong();
    private final AtomicLong missCount = new AtomicLong();
    
    public StatisticsCache(Cache delegate) {
        this.delegate = delegate;
    }
    
    @Override
    public Object get(String key) {
        Object value = delegate.get(key);
        if (value != null) hitCount.incrementAndGet();
        else missCount.incrementAndGet();
        return value;
    }
    
    @Override
    public void put(String key, Object value) {
        delegate.put(key, value);
    }
    
    public double getHitRate() {
        long total = hitCount.get() + missCount.get();
        return total == 0 ? 0 : (double) hitCount.get() / total;
    }
}
```

### 3.3 适配器模式

```java
// 将不兼容的接口转换为客户端期望的接口
// Spring MVC 中 HandlerAdapter 就是适配器模式

// 目标接口
public interface Target {
    void request();
}

// 被适配的类（已有，不能修改）
public class Adaptee {
    public void specificRequest() { ... }
}

// 适配器
public class Adapter implements Target {
    private final Adaptee adaptee;
    
    public Adapter(Adaptee adaptee) {
        this.adaptee = adaptee;
    }
    
    @Override
    public void request() {
        adaptee.specificRequest();  // 转换调用
    }
}
```

### 3.4 门面模式（Facade）

```java
// 为复杂子系统提供简单接口
// Spring 的 JdbcTemplate、RestTemplate 都是门面模式

public class OrderFacade {
    private final InventoryService inventoryService;
    private final PaymentService paymentService;
    private final NotificationService notificationService;
    private final LogisticsService logisticsService;
    
    public OrderResult placeOrder(OrderRequest request) {
        // 封装复杂的下单流程
        inventoryService.reserve(request.getItems());
        PaymentResult payment = paymentService.pay(request.getPayment());
        logisticsService.createShipment(request);
        notificationService.sendConfirmation(request.getUserId());
        return OrderResult.success(payment.getOrderId());
    }
}
```

---

## 4. 行为型模式

### 4.1 策略模式 ⭐

```java
// 消除 if-else，支持算法动态切换

// 策略接口
public interface DiscountStrategy {
    BigDecimal calculate(BigDecimal price, Order order);
}

// 具体策略
@Component("vipDiscount")
public class VipDiscountStrategy implements DiscountStrategy {
    @Override
    public BigDecimal calculate(BigDecimal price, Order order) {
        return price.multiply(new BigDecimal("0.9"));  // 9折
    }
}

@Component("couponDiscount")
public class CouponDiscountStrategy implements DiscountStrategy {
    @Override
    public BigDecimal calculate(BigDecimal price, Order order) {
        return price.subtract(order.getCouponAmount());
    }
}

// 策略工厂（利用 Spring 注入所有策略）
@Component
public class DiscountStrategyFactory {
    @Autowired
    private Map<String, DiscountStrategy> strategies;  // Spring 自动注入所有实现
    
    public DiscountStrategy getStrategy(String type) {
        DiscountStrategy strategy = strategies.get(type + "Discount");
        if (strategy == null) {
            throw new IllegalArgumentException("Unknown discount type: " + type);
        }
        return strategy;
    }
}
```

### 4.2 观察者模式

```java
// Spring 事件机制就是观察者模式

// 自定义事件
public class OrderCreatedEvent extends ApplicationEvent {
    private final Order order;
    
    public OrderCreatedEvent(Object source, Order order) {
        super(source);
        this.order = order;
    }
}

// 发布事件
@Service
public class OrderService {
    @Autowired
    private ApplicationEventPublisher eventPublisher;
    
    public void createOrder(Order order) {
        // 业务逻辑
        orderRepository.save(order);
        // 发布事件（解耦）
        eventPublisher.publishEvent(new OrderCreatedEvent(this, order));
    }
}

// 监听事件
@Component
public class OrderEventListener {
    
    @EventListener
    @Async  // 异步处理
    public void onOrderCreated(OrderCreatedEvent event) {
        // 发送通知、更新库存等
        notificationService.send(event.getOrder());
    }
}
```

### 4.3 责任链模式 ⭐

```java
// 适用：请求需要经过多个处理器，每个处理器决定是否处理或传递

// 抽象处理器
public abstract class Handler {
    protected Handler next;
    
    public Handler setNext(Handler next) {
        this.next = next;
        return next;
    }
    
    public abstract boolean handle(Request request);
}

// 具体处理器
public class AuthHandler extends Handler {
    @Override
    public boolean handle(Request request) {
        if (!isAuthenticated(request)) {
            return false;  // 拦截
        }
        return next != null && next.handle(request);
    }
}

public class RateLimitHandler extends Handler {
    @Override
    public boolean handle(Request request) {
        if (isRateLimited(request)) {
            return false;
        }
        return next != null && next.handle(request);
    }
}

// 构建责任链
Handler chain = new AuthHandler();
chain.setNext(new RateLimitHandler())
     .setNext(new LogHandler())
     .setNext(new BusinessHandler());

chain.handle(request);

// Spring 中的责任链：Filter 链、Interceptor 链
```

### 4.4 模板方法模式

```java
// 定义算法骨架，子类实现具体步骤
// Spring 中大量使用：JdbcTemplate、RestTemplate、AbstractApplicationContext

public abstract class DataExporter {
    
    // 模板方法（final 防止子类修改流程）
    public final void export(String destination) {
        List<Object> data = fetchData();      // 抽象方法
        List<Object> processed = process(data); // 钩子方法（有默认实现）
        write(processed, destination);         // 抽象方法
        afterExport();                         // 钩子方法
    }
    
    protected abstract List<Object> fetchData();
    protected abstract void write(List<Object> data, String destination);
    
    // 钩子方法：子类可选择性重写
    protected List<Object> process(List<Object> data) {
        return data;  // 默认不处理
    }
    
    protected void afterExport() {
        // 默认空实现
    }
}

public class CsvExporter extends DataExporter {
    @Override
    protected List<Object> fetchData() {
        return dbService.queryAll();
    }
    
    @Override
    protected void write(List<Object> data, String destination) {
        csvWriter.write(data, destination);
    }
}
```

### 4.5 状态模式

```java
// 适用：对象行为随状态变化而变化，消除大量 if-else

// 订单状态机
public interface OrderState {
    void pay(Order order);
    void ship(Order order);
    void complete(Order order);
    void cancel(Order order);
}

public class PendingState implements OrderState {
    @Override
    public void pay(Order order) {
        order.setState(new PaidState());
    }
    
    @Override
    public void cancel(Order order) {
        order.setState(new CancelledState());
    }
    
    @Override
    public void ship(Order order) {
        throw new IllegalStateException("待支付订单不能发货");
    }
    
    @Override
    public void complete(Order order) {
        throw new IllegalStateException("待支付订单不能完成");
    }
}

public class Order {
    private OrderState state = new PendingState();
    
    public void setState(OrderState state) { this.state = state; }
    public void pay() { state.pay(this); }
    public void ship() { state.ship(this); }
    public void complete() { state.complete(this); }
    public void cancel() { state.cancel(this); }
}
```

---

## 5. Spring 中的设计模式应用实例

| 设计模式 | Spring 应用 |
|----------|------------|
| 单例模式 | Bean 默认单例（`@Scope("singleton")`） |
| 工厂模式 | `BeanFactory`、`ApplicationContext` |
| 代理模式 | AOP（JDK 动态代理/CGLIB） |
| 模板方法 | `JdbcTemplate`、`RestTemplate`、`AbstractApplicationContext.refresh()` |
| 观察者模式 | `ApplicationEvent`/`ApplicationListener` |
| 装饰器模式 | `BeanWrapper`、`HttpServletRequestWrapper` |
| 适配器模式 | `HandlerAdapter`（适配不同类型的 Handler） |
| 责任链模式 | `FilterChain`、`HandlerInterceptor` 链 |
| 策略模式 | `Resource`（不同资源加载策略）、`TransactionManager` |
| 门面模式 | `JdbcTemplate`、`RedisTemplate` |
| 建造者模式 | `BeanDefinitionBuilder`、`UriComponentsBuilder` |

---

## 高频面试真题

### Q1：单例模式有哪几种实现？各有什么优缺点？

**答题框架**：
- 饿汉式：类加载时初始化，线程安全，但可能浪费内存
- 懒汉式（synchronized）：延迟加载，线程安全，但每次获取都加锁，性能差
- DCL（双重检查锁）：延迟加载，线程安全，需要 volatile 防止指令重排
- 静态内部类：延迟加载，线程安全（类加载机制保证），推荐
- 枚举：最简洁，防反射/序列化攻击，推荐

### Q2：策略模式如何消除 if-else？

**答题框架**：
- 定义策略接口，每种策略一个实现类
- 利用 Spring 的 Map 注入（`Map<String, Strategy>`），key 为 Bean 名称
- 根据业务类型动态获取策略，替代 if-else 分支
- 新增策略只需添加新实现类，符合开闭原则

### Q3：代理模式和装饰器模式的区别？

**答题框架**：
- 代理：控制访问，代理类通常自己持有被代理对象（或自己创建），关注访问控制
- 装饰器：增强功能，装饰器接收被装饰对象（外部传入），关注功能扩展
- 结构相似，意图不同；装饰器可以多层嵌套（如 Java IO）

### Q4：责任链模式的应用场景？

**答题框架**：
- 请求需要经过多个处理步骤，且步骤可动态配置
- 应用：Spring Filter 链、Netty Pipeline、审批流程、风控规则链
- 优点：解耦请求发送者和处理者，处理器可动态增减
- 缺点：链过长时性能下降，调试困难

### Q5：观察者模式和发布订阅模式的区别？

**答题框架**：
- 观察者：观察者直接订阅主题，主题直接通知观察者（耦合）
- 发布订阅：通过消息中间件（事件总线）解耦，发布者和订阅者互不知晓
- Spring ApplicationEvent 是观察者模式；Kafka/RocketMQ 是发布订阅模式
- 发布订阅更适合分布式场景，支持异步、持久化、重试

---

## 学习建议

**备考重点**：单例模式（必考）、策略模式（高频）、代理模式（必考）、观察者模式（高频）

**推荐资源**：
- 《设计模式：可复用面向对象软件的基础》（GoF）
- 《Head First 设计模式》（入门友好）
- refactoring.guru（图文并茂的设计模式讲解）
