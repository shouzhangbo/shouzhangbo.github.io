# 模块一：Java 基础进阶

> 面向 P6/P7 级别，聚焦底层机制与实战经验

---

## 1. 泛型机制与类型擦除

### 1.1 核心原理

Java 泛型是**编译期特性**，通过**类型擦除（Type Erasure）**实现。编译器在编译时检查类型安全，生成字节码时将泛型信息擦除，替换为原始类型（Raw Type）或边界类型。

```java
// 编译前
List<String> list = new ArrayList<String>();
list.add("hello");
String s = list.get(0);

// 编译后（字节码等价）
List list = new ArrayList();
list.add("hello");
String s = (String) list.get(0);  // 编译器自动插入强制转换
```

### 1.2 类型擦除规则

| 泛型声明 | 擦除后类型 |
|----------|-----------|
| `T` | `Object` |
| `T extends Comparable` | `Comparable` |
| `T extends A & B` | `A`（第一个边界） |
| `List<T>` | `List` |

### 1.3 桥接方法（Bridge Method）

类型擦除会导致多态问题，编译器通过生成**桥接方法**解决：

```java
interface Comparable<T> {
    int compareTo(T o);
}

class MyInteger implements Comparable<MyInteger> {
    public int compareTo(MyInteger o) { return 0; }
    // 编译器自动生成桥接方法：
    // public int compareTo(Object o) { return compareTo((MyInteger) o); }
}
```

### 1.4 泛型通配符

```java
// 上界通配符：只读，适合生产者
List<? extends Number> producer = new ArrayList<Integer>();
Number n = producer.get(0);  // OK
// producer.add(1);  // 编译错误

// 下界通配符：只写，适合消费者
List<? super Integer> consumer = new ArrayList<Number>();
consumer.add(1);  // OK
// Integer i = consumer.get(0);  // 编译错误，只能用 Object 接收

// PECS 原则：Producer Extends, Consumer Super
```

### 1.5 ⭐ 常见坑点

```java
// 坑1：泛型数组不能创建
// List<String>[] arr = new List<String>[10];  // 编译错误

// 坑2：instanceof 不能用于泛型
// if (obj instanceof List<String>)  // 编译错误
if (obj instanceof List<?>)  // OK

// 坑3：静态成员不能使用类的泛型参数
class Foo<T> {
    // static T instance;  // 编译错误
    static <T> T create() { return null; }  // OK，方法自己的泛型
}

// 坑4：运行时获取泛型信息（通过反射）
class TypeToken<T> {
    Type getType() {
        return ((ParameterizedType) getClass()
            .getGenericSuperclass()).getActualTypeArguments()[0];
    }
}
// 使用：new TypeToken<List<String>>(){}.getType()
```

---

## 2. 反射与动态代理

### 2.1 反射核心 API

```java
// 获取 Class 对象的三种方式
Class<?> c1 = String.class;                    // 编译期已知
Class<?> c2 = "hello".getClass();              // 运行时对象
Class<?> c3 = Class.forName("java.lang.String"); // 动态加载

// 反射操作
Method method = c1.getDeclaredMethod("charAt", int.class);
method.setAccessible(true);  // 突破访问限制
Object result = method.invoke("hello", 0);  // 'h'

// 反射性能优化
// 1. 缓存 Method/Field 对象，避免重复 getDeclaredMethod
// 2. setAccessible(true) 跳过访问检查
// 3. Java 9+ 使用 MethodHandles 替代反射，性能更好
```

### 2.2 JDK 动态代理

**原理**：基于接口，运行时生成代理类字节码，继承 `Proxy` 类并实现目标接口。

```java
public interface UserService {
    void save(User user);
}

// InvocationHandler 实现
public class LoggingHandler implements InvocationHandler {
    private final Object target;
    
    public LoggingHandler(Object target) {
        this.target = target;
    }
    
    @Override
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        System.out.println("Before: " + method.getName());
        long start = System.currentTimeMillis();
        try {
            return method.invoke(target, args);
        } finally {
            System.out.println("After: " + (System.currentTimeMillis() - start) + "ms");
        }
    }
}

// 创建代理
UserService proxy = (UserService) Proxy.newProxyInstance(
    UserService.class.getClassLoader(),
    new Class[]{UserService.class},
    new LoggingHandler(new UserServiceImpl())
);
```

**底层机制**：`Proxy.newProxyInstance` 调用 `ProxyGenerator.generateProxyClass` 动态生成字节码，生成的代理类继承 `java.lang.reflect.Proxy`，实现所有目标接口，每个方法调用都委托给 `InvocationHandler.invoke`。

### 2.3 CGLIB 动态代理

**原理**：基于继承，通过 ASM 框架在运行时生成目标类的子类，重写所有非 final 方法。

```java
public class CglibProxy implements MethodInterceptor {
    
    public Object createProxy(Class<?> targetClass) {
        Enhancer enhancer = new Enhancer();
        enhancer.setSuperclass(targetClass);
        enhancer.setCallback(this);
        return enhancer.create();
    }
    
    @Override
    public Object intercept(Object obj, Method method, Object[] args, 
                            MethodProxy proxy) throws Throwable {
        System.out.println("Before: " + method.getName());
        // 注意：使用 proxy.invokeSuper 而非 method.invoke，避免死循环
        return proxy.invokeSuper(obj, args);
    }
}
```

### 2.4 JDK 代理 vs CGLIB 对比 ⭐

| 维度 | JDK 动态代理 | CGLIB |
|------|-------------|-------|
| 实现方式 | 基于接口 | 基于继承（子类） |
| 目标类要求 | 必须实现接口 | 无需接口，但不能是 final 类 |
| 生成方式 | 反射生成字节码 | ASM 直接操作字节码 |
| 性能（JDK8+） | 接近 CGLIB | 略快（FastClass 机制） |
| Spring 默认 | 有接口时使用 | 无接口或强制时使用 |
| final 方法 | 不支持 | 不支持（无法重写） |

> 💡 **加分项**：Spring Boot 2.x 后默认使用 CGLIB（`spring.aop.proxy-target-class=true`），因为 CGLIB 不需要目标类实现接口，更通用。

---

## 3. 注解处理机制

### 3.1 注解元信息

```java
@Target({ElementType.METHOD, ElementType.TYPE})  // 作用目标
@Retention(RetentionPolicy.RUNTIME)               // 保留策略
@Documented                                        // 包含在 JavaDoc
@Inherited                                         // 子类继承父类注解
public @interface MyAnnotation {
    String value() default "";
    int timeout() default 3000;
}
```

**Retention 策略对比**：

| 策略 | 说明 | 使用场景 |
|------|------|----------|
| `SOURCE` | 编译后丢弃 | `@Override`、`@SuppressWarnings`、Lombok |
| `CLASS` | 保留在 class 文件，运行时不可见 | 字节码增强工具 |
| `RUNTIME` | 运行时可通过反射读取 | Spring 注解、自定义框架 |

### 3.2 注解处理器（APT）

编译期注解处理，用于代码生成（Lombok、MapStruct、Dagger）：

```java
@SupportedAnnotationTypes("com.example.Builder")
@SupportedSourceVersion(SourceVersion.RELEASE_17)
public class BuilderProcessor extends AbstractProcessor {
    
    @Override
    public boolean process(Set<? extends TypeElement> annotations, 
                           RoundEnvironment roundEnv) {
        for (Element element : roundEnv.getElementsAnnotatedWith(Builder.class)) {
            generateBuilderClass((TypeElement) element);
        }
        return true;
    }
}
```

### 3.3 运行时注解处理

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RateLimit {
    int qps() default 100;
    String key() default "";
}

@Aspect
@Component
public class RateLimitAspect {
    
    @Around("@annotation(rateLimit)")
    public Object around(ProceedingJoinPoint pjp, RateLimit rateLimit) throws Throwable {
        String key = rateLimit.key().isEmpty() 
            ? pjp.getSignature().toShortString() 
            : rateLimit.key();
        // 限流逻辑...
        return pjp.proceed();
    }
}
```

---

## 4. 异常体系设计

### 4.1 异常层次结构

```
Throwable
├── Error（不可恢复，不应捕获）
│   ├── OutOfMemoryError
│   ├── StackOverflowError
│   └── VirtualMachineError
└── Exception
    ├── RuntimeException（非受检异常）
    │   ├── NullPointerException
    │   ├── IllegalArgumentException
    │   ├── IllegalStateException
    │   └── IndexOutOfBoundsException
    └── 受检异常（Checked Exception）
        ├── IOException
        ├── SQLException
        └── ClassNotFoundException
```

### 4.2 异常设计最佳实践

```java
// 1. 自定义业务异常体系
public class BusinessException extends RuntimeException {
    private final ErrorCode errorCode;
    
    public BusinessException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }
    
    public BusinessException(ErrorCode errorCode, Throwable cause) {
        super(errorCode.getMessage(), cause);
        this.errorCode = errorCode;
    }
}

public enum ErrorCode {
    USER_NOT_FOUND("USER_001", "用户不存在"),
    ORDER_EXPIRED("ORDER_001", "订单已过期");
    
    private final String code;
    private final String message;
    
    ErrorCode(String code, String message) {
        this.code = code;
        this.message = message;
    }
    
    public String getMessage() { return message; }
}

// 2. 异常链保留（不要吞掉原始异常）
try {
    // ...
} catch (SQLException e) {
    throw new DataAccessException("数据库操作失败", e);  // 保留原始异常
}

// 3. try-with-resources 自动关闭资源
try (Connection conn = dataSource.getConnection();
     PreparedStatement ps = conn.prepareStatement(sql)) {
    // ...
}  // 自动调用 close()，即使发生异常
```

### 4.3 ⭐ 常见坑点

```java
// 坑1：finally 中 return 会吞掉异常
try {
    throw new RuntimeException("error");
} finally {
    return "ok";  // 异常被吞掉！永远不要在 finally 中 return
}

// 坑2：catch 顺序错误（父类在前）
try {
    // ...
} catch (Exception e) {      // 错误：父类在前，子类永远不会被捕获
} catch (IOException e) {    // 编译错误：unreachable code
}

// 坑3：异常信息丢失
catch (Exception e) {
    throw new RuntimeException("操作失败");  // 丢失原始异常栈
    // 正确：throw new RuntimeException("操作失败", e);
}
```

---

## 5. Java 8~21 新特性 ⭐

### 5.1 Stream API 原理

```java
// Stream 流水线：惰性求值
List<String> result = list.stream()
    .filter(s -> s.length() > 3)    // 中间操作（惰性）
    .map(String::toUpperCase)        // 中间操作（惰性）
    .sorted()                        // 有状态中间操作
    .limit(10)                       // 短路操作
    .collect(Collectors.toList());   // 终止操作（触发执行）
```

**底层机制**：Stream 使用**流水线（Pipeline）**模式，由 `ReferencePipeline` 实现。中间操作不立即执行，终止操作触发整个流水线，数据逐元素流过所有操作（减少中间集合创建）。

```java
// 并行流注意事项
list.parallelStream()
    .filter(...)
    .collect(Collectors.toList());
// 底层使用 ForkJoinPool.commonPool()
// 注意：共享线程池，不适合 IO 密集型操作
// 建议：自定义 ForkJoinPool
ForkJoinPool pool = new ForkJoinPool(4);
pool.submit(() -> list.parallelStream().forEach(...)).get();
```

### 5.2 Optional 正确使用

```java
// 错误用法：Optional 不是 null 的替代品
Optional<User> opt = Optional.ofNullable(user);
if (opt.isPresent()) {  // 这和 null 检查没区别
    return opt.get();
}

// 正确用法：链式操作
return Optional.ofNullable(user)
    .map(User::getAddress)
    .map(Address::getCity)
    .orElse("未知城市");

// 抛出自定义异常
return Optional.ofNullable(user)
    .orElseThrow(() -> new UserNotFoundException(userId));
```

### 5.3 Java 9~17 重要特性

```java
// Java 9: 接口私有方法
interface Validator {
    default boolean validate(String s) {
        return isNotNull(s) && isNotEmpty(s);
    }
    private boolean isNotNull(String s) { return s != null; }
    private boolean isNotEmpty(String s) { return !s.isEmpty(); }
}

// Java 10: var 局部变量类型推断
var list = new ArrayList<String>();  // 推断为 ArrayList<String>
var map = new HashMap<String, Integer>();

// Java 14: instanceof 模式匹配
if (obj instanceof String s) {
    System.out.println(s.length());  // 无需强转
}

// Java 14: Switch 表达式
String result = switch (day) {
    case MONDAY, FRIDAY -> "工作日";
    case SATURDAY, SUNDAY -> "周末";
    default -> throw new IllegalArgumentException();
};

// Java 15: Text Block
String json = """
        {
            "name": "张三",
            "age": 30
        }
        """;

// Java 16: Record（不可变数据类）
public record Point(int x, int y) {
    // 自动生成：构造器、getter、equals、hashCode、toString
    // 可以添加自定义方法
    public double distance() {
        return Math.sqrt(x * x + y * y);
    }
}

// Java 17: Sealed Classes（密封类）
public sealed class Shape permits Circle, Rectangle, Triangle {
    // 限制子类范围，配合 pattern matching 使用
}
```

### 5.4 Java 21 虚拟线程（Virtual Threads）⭐

```java
// 传统线程：每个线程对应一个 OS 线程，创建成本高
Thread thread = new Thread(() -> {
    // 阻塞 IO 会占用 OS 线程
});

// 虚拟线程：轻量级，由 JVM 调度，阻塞时不占用 OS 线程
Thread vThread = Thread.ofVirtual().start(() -> {
    // 阻塞 IO 时，JVM 自动挂起虚拟线程，释放 OS 线程
    Thread.sleep(1000);  // 不会阻塞 OS 线程
});

// 使用 ExecutorService
try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 100_000; i++) {
        executor.submit(() -> {
            // 每个任务一个虚拟线程，轻松创建百万级并发
            callRemoteService();
        });
    }
}
```

**虚拟线程 vs 平台线程**：

| 维度 | 平台线程 | 虚拟线程 |
|------|----------|----------|
| 创建成本 | 高（~1MB 栈） | 极低（~几KB） |
| 数量上限 | 数千 | 数百万 |
| 阻塞行为 | 占用 OS 线程 | 自动挂起，释放 OS 线程 |
| 适用场景 | CPU 密集型 | IO 密集型（HTTP/DB/文件） |
| 线程池 | 需要池化 | 无需池化，用完即弃 |

> ⚠️ **注意**：虚拟线程不适合 CPU 密集型任务，也不适合使用 `synchronized` 持有锁时进行阻塞（会导致 carrier thread 被 pin 住）。

### 5.5 Java 21 其他重要特性

```java
// Sequenced Collections：有序集合接口
SequencedCollection<String> sc = new ArrayList<>();
sc.addFirst("a");
sc.addLast("z");
String first = sc.getFirst();
String last = sc.getLast();
SequencedCollection<String> reversed = sc.reversed();

// Pattern Matching for switch（正式版）
Object obj = ...;
String result = switch (obj) {
    case Integer i when i > 0 -> "正整数: " + i;
    case Integer i -> "非正整数: " + i;
    case String s -> "字符串: " + s;
    case null -> "null";
    default -> "其他: " + obj;
};
```

---

## 6. SPI 机制

### 6.1 核心原理

SPI（Service Provider Interface）是 Java 提供的**服务发现机制**，允许第三方为接口提供实现，实现**解耦**和**可扩展性**。

**工作流程**：
1. 定义服务接口
2. 实现类在 `META-INF/services/接口全限定名` 文件中注册
3. `ServiceLoader` 扫描 classpath 加载实现类

```java
// 1. 定义接口
public interface DatabaseDriver {
    Connection connect(String url);
    boolean supports(String url);
}

// 2. 实现类（在 META-INF/services/com.example.DatabaseDriver 文件中注册）
// 文件内容：com.mysql.cj.jdbc.Driver

// 3. 使用 ServiceLoader 加载
ServiceLoader<DatabaseDriver> loader = ServiceLoader.load(DatabaseDriver.class);
for (DatabaseDriver driver : loader) {
    if (driver.supports(url)) {
        return driver.connect(url);
    }
}
```

### 6.2 SPI 应用场景

| 框架 | SPI 应用 |
|------|----------|
| JDBC | `java.sql.Driver` 驱动加载 |
| SLF4J | 日志实现绑定 |
| Spring Boot | `spring.factories` 自动装配 |
| Dubbo | 扩展点加载（增强版 SPI） |

### 6.3 Dubbo SPI vs Java SPI

```java
// Java SPI：一次性加载所有实现，无法按需加载
ServiceLoader<Protocol> loader = ServiceLoader.load(Protocol.class);

// Dubbo SPI：按名称加载，支持 AOP/IOC，支持自适应扩展
@SPI("dubbo")  // 默认实现
public interface Protocol {
    @Adaptive  // 自适应扩展点
    <T> Exporter<T> export(Invoker<T> invoker);
}

// 使用
Protocol protocol = ExtensionLoader.getExtensionLoader(Protocol.class)
    .getExtension("dubbo");  // 按名称获取
```

> 💡 **加分项**：Spring Boot 的 `spring.factories` 本质上是增强版 SPI，支持按类型分组加载，是自动装配的核心机制。

---

## 高频面试真题

### Q1：Java 泛型的类型擦除是什么？有什么影响？

**答题框架**：
- **是什么**：编译期将泛型信息擦除，替换为原始类型或边界类型
- **为什么**：兼容 JDK 1.5 之前的代码（向后兼容）
- **影响**：
  - 运行时无法获取泛型参数类型（`List<String>` 和 `List<Integer>` 运行时相同）
  - 不能创建泛型数组
  - 不能用 instanceof 判断泛型类型
- **绕过方式**：通过匿名子类保留泛型信息（TypeToken 模式），或通过反射获取父类/接口的泛型参数

### Q2：JDK 动态代理和 CGLIB 的区别？Spring 如何选择？

**答题框架**：
- JDK：基于接口，反射实现，目标类必须有接口
- CGLIB：基于继承，ASM 字节码，不需要接口，不能代理 final 类/方法
- Spring 选择策略：有接口默认 JDK（Spring 4.x），Spring Boot 2.x 后默认 CGLIB
- 性能：JDK 8 后两者性能接近，CGLIB 的 FastClass 机制避免了反射调用

### Q3：Java 虚拟线程和传统线程的区别？适用场景？

**答题框架**：
- 虚拟线程是 JVM 管理的轻量级线程，阻塞时不占用 OS 线程
- 适合 IO 密集型：HTTP 调用、数据库查询、文件读写
- 不适合 CPU 密集型：计算任务用平台线程更合适
- 注意事项：避免在 synchronized 块中阻塞（会 pin 住 carrier thread），推荐用 ReentrantLock

### Q4：Stream 的惰性求值是什么？有什么好处？

**答题框架**：
- 中间操作（filter/map/sorted）不立即执行，只有终止操作（collect/forEach/count）才触发
- 好处：避免创建中间集合，减少内存占用；支持短路操作（findFirst/limit）提前终止
- 底层：ReferencePipeline 链式结构，终止操作触发从头到尾的流水线执行

### Q5：SPI 机制的原理？与 Spring 自动装配的关系？

**答题框架**：
- SPI：`ServiceLoader` 扫描 `META-INF/services/` 目录，按接口全限定名加载实现类
- Spring Boot 自动装配：`@EnableAutoConfiguration` 触发，读取 `META-INF/spring.factories`（Spring Boot 2.x）或 `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`（Spring Boot 3.x）
- 本质都是服务发现机制，Spring Boot 在此基础上增加了 `@Conditional` 条件过滤

---

## 学习建议

**备考重点**：泛型类型擦除（必考）、JDK vs CGLIB 动态代理（必考）、Java 8 Stream 原理、Java 21 虚拟线程（加分项）

**推荐资源**：
- 《Java 编程思想》第 15 章（泛型）
- OpenJDK 源码：`java.lang.reflect.Proxy`、`java.util.stream.ReferencePipeline`
- JEP 444（Virtual Threads）官方文档
- 《Effective Java》第 3 版（泛型章节）
