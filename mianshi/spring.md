# Spring、Spring MVC、Spring Boot 面试资料

## 1. Spring Framework

### 1.1 IOC（控制反转）与 DI（依赖注入）

#### 1.1.1 概念
- **IoC（Inversion of Control）**：将对象的创建和管理权从程序代码转移到外部容器，降低耦合度。
- **DI（Dependency Injection）**：IoC的一种实现方式，组件之间的依赖关系由容器在运行时动态注入。

#### 1.1.2 IoC 容器
Spring 提供两种核心容器接口：
- **BeanFactory**：基础容器，提供基本的DI支持，使用懒加载，适合资源受限环境。
- **ApplicationContext**：BeanFactory的子接口，添加了更多企业级功能（如AOP、事件发布、国际化等），默认启动时预加载所有单例Bean。

**常用实现类**：
- `ClassPathXmlApplicationContext`
- `AnnotationConfigApplicationContext`
- `WebApplicationContext`

#### 1.1.3 Bean 的生命周期
Spring Bean 的完整生命周期包含以下阶段：

1. **实例化**：通过反射创建Bean实例。
2. **属性赋值**：填充Bean属性（依赖注入）。
3. **BeanNameAware**：如果实现该接口，调用`setBeanName()`传递Bean ID。
4. **BeanFactoryAware**：如果实现该接口，调用`setBeanFactory()`传递工厂引用。
5. **ApplicationContextAware**：如果实现该接口，调用`setApplicationContext()`传递应用上下文。
6. **BeanPostProcessor 前置处理**：调用`postProcessBeforeInitialization()`。
7. **InitializingBean**：如果实现该接口，调用`afterPropertiesSet()`。
8. **自定义初始化方法**：如果配置了`init-method`，调用指定方法。
9. **BeanPostProcessor 后置处理**：调用`postProcessAfterInitialization()`，此时Bean可用了。
10. **使用Bean**。
11. **DisposableBean**：如果实现该接口，调用`destroy()`。
12. **自定义销毁方法**：如果配置了`destroy-method`，调用指定方法。

**简图**：
```
实例化 → 属性赋值 → 各种Aware → 前置处理 → 初始化 → 后置处理 → 就绪 → 销毁
```

#### 1.1.4 Bean 的作用域
| 作用域 | 说明 |
|--------|------|
| **singleton**（默认） | 每个Spring容器中只有一个Bean实例 |
| **prototype** | 每次获取都会创建一个新实例 |
| **request** | 每个HTTP请求创建一个Bean，仅Web应用有效 |
| **session** | 每个HTTP会话创建一个Bean，仅Web应用有效 |
| **application** | 每个ServletContext创建一个Bean，仅Web应用有效 |
| **websocket** | 每个WebSocket会话创建一个Bean |

#### 1.1.5 Bean 的自动装配模式
- **no**：默认，不自动装配，需显式引用。
- **byName**：根据属性名与容器中Bean ID匹配。
- **byType**：根据属性类型查找容器中唯一Bean，若存在多个则抛出异常。
- **constructor**：类似于byType，但应用于构造器参数。
- **autodetect**：（已废弃）先尝试constructor，再byType。

**常用注解**：
- `@Autowired`：按类型注入，可配合`@Qualifier`指定名称。
- `@Resource`（JSR-250）：默认按名称注入。
- `@Inject`（JSR-330）：类似`@Autowired`。

### 1.2 AOP（面向切面编程）

#### 1.2.1 核心概念
- **Aspect（切面）**：关注点模块化，如日志、事务。
- **Join Point（连接点）**：程序执行中的某个点，如方法调用、异常抛出。
- **Advice（通知）**：在特定连接点执行的动作，包括`@Before`、`@After`、`@Around`等。
- **Pointcut（切点）**：匹配连接点的表达式，如`execution(* com.example.service.*.*(..))`。
- **Introduction（引入）**：向现有类添加新方法或属性。
- **Target Object（目标对象）**：被代理的对象。
- **Weaving（织入）**：将切面应用到目标对象的过程，可在编译期、类加载期、运行期进行。

#### 1.2.2 代理机制
Spring AOP 基于动态代理实现：
- **JDK动态代理**：要求目标对象实现接口，通过`java.lang.reflect.Proxy`生成代理类。
- **CGLIB代理**：目标对象无需实现接口，通过生成子类的方式创建代理（通过继承）。

**选择规则**：如果目标对象实现了至少一个接口，默认使用JDK动态代理；否则使用CGLIB。可强制使用CGLIB（`proxy-target-class=true`）。

#### 1.2.3 通知类型
| 注解 | 说明 |
|------|------|
| `@Before` | 在方法执行前执行 |
| `@After` | 在方法执行后执行（无论是否异常） |
| `@AfterReturning` | 在方法成功返回后执行 |
| `@AfterThrowing` | 在方法抛出异常后执行 |
| `@Around` | 环绕通知，可控制方法执行前后，需手动调用`proceed()` |

#### 1.2.4 应用场景
- 事务管理（`@Transactional`底层使用AOP）
- 日志记录
- 权限校验
- 性能监控
- 缓存处理

### 1.3 事务管理

#### 1.3.1 声明式事务 @Transactional
通过在方法或类上添加`@Transactional`注解，Spring会自动在方法前后开启、提交或回滚事务。

**实现原理**：基于AOP，通过代理模式在调用目标方法前获取事务，方法执行完毕后根据情况提交或回滚。

#### 1.3.2 事务传播行为
当一个事务方法被另一个事务方法调用时，事务如何传播。Spring定义了7种传播行为：

| 传播行为 | 说明 |
|---------|------|
| `REQUIRED`（默认） | 当前存在事务则加入，不存在则新建 |
| `SUPPORTS` | 当前存在事务则加入，不存在则以非事务方式运行 |
| `MANDATORY` | 当前必须存在事务，否则抛出异常 |
| `REQUIRES_NEW` | 挂起当前事务，新建一个事务运行 |
| `NOT_SUPPORTED` | 以非事务方式运行，挂起当前事务 |
| `NEVER` | 以非事务方式运行，如果当前存在事务则抛出异常 |
| `NESTED` | 如果当前存在事务，则在嵌套事务中执行（利用保存点实现部分回滚） |

#### 1.3.3 事务隔离级别
数据库隔离级别在事务中的映射，Spring使用`@Transactional(isolation = Isolation.DEFAULT)`，通常使用数据库默认级别。

| 隔离级别 | 说明 |
|---------|------|
| `DEFAULT` | 使用数据库默认隔离级别 |
| `READ_UNCOMMITTED` | 读未提交，可能脏读、不可重复读、幻读 |
| `READ_COMMITTED` | 读已提交，避免脏读，但可能不可重复读、幻读 |
| `REPEATABLE_READ` | 可重复读，避免脏读、不可重复读，但可能幻读（InnoDB可解决） |
| `SERIALIZABLE` | 串行化，最高级别，性能低 |

### 1.4 Spring事件机制

#### 1.4.1 核心组件
- **事件（Event）**：继承`ApplicationEvent`的POJO。
- **监听器（Listener）**：实现`ApplicationListener`接口或使用`@EventListener`注解。
- **发布器（Publisher）**：通过`ApplicationEventPublisher`发布事件。

#### 1.4.2 使用示例
```java
// 自定义事件
public class OrderCreatedEvent extends ApplicationEvent {
    private Long orderId;
    public OrderCreatedEvent(Object source, Long orderId) {
        super(source);
        this.orderId = orderId;
    }
    // getter...
}

// 监听器
@Component
public class OrderEventListener {
    @EventListener
    public void handleOrderCreated(OrderCreatedEvent event) {
        System.out.println("订单创建：" + event.getOrderId());
    }
}

// 发布事件
@Service
public class OrderService {
    @Autowired
    private ApplicationEventPublisher publisher;
    public void createOrder() {
        // 业务逻辑
        publisher.publishEvent(new OrderCreatedEvent(this, 123L));
    }
}
```

#### 1.4.3 应用场景
- 业务解耦（如订单完成后发送短信、邮件等）
- 缓存更新
- 日志记录

## 2. Spring MVC

### 2.1 核心组件
- **DispatcherServlet**：前端控制器，接收所有请求，分发给处理器。
- **HandlerMapping**：根据请求查找对应的Handler（Controller方法）。
- **HandlerAdapter**：调用Handler并处理参数、返回值。
- **ViewResolver**：根据逻辑视图名解析为具体视图（如JSP、Thymeleaf）。
- **View**：渲染模型数据。
- **HandlerInterceptor**：拦截器，在Handler执行前后进行预处理、后处理。

### 2.2 处理请求流程
1. 客户端发送请求到`DispatcherServlet`。
2. `DispatcherServlet`查询`HandlerMapping`找到对应的Handler（Controller）及拦截器链。
3. `DispatcherServlet`调用`HandlerAdapter`执行Handler。
4. Handler执行完成返回`ModelAndView`给`DispatcherServlet`。
5. `DispatcherServlet`将`ModelAndView`交给`ViewResolver`解析为实际视图。
6. `View`渲染模型数据，生成响应。
7. 响应返回客户端。

### 2.3 常用注解
| 注解 | 作用 |
|------|------|
| `@Controller` | 声明该类为Spring MVC控制器 |
| `@RestController` | `@Controller` + `@ResponseBody`，所有方法返回JSON/XML |
| `@RequestMapping` | 映射HTTP请求到处理方法（可指定路径、方法类型等） |
| `@GetMapping`、`@PostMapping`等 | 组合了`@RequestMapping`和具体HTTP方法 |
| `@RequestParam` | 绑定请求参数到方法参数 |
| `@PathVariable` | 绑定URL路径变量 |
| `@RequestBody` | 绑定HTTP请求体到方法参数（常用于JSON） |
| `@ResponseBody` | 将方法返回值直接写入HTTP响应体（而非视图） |
| `@ModelAttribute` | 将方法参数或返回值绑定到Model中 |

### 2.4 数据绑定与验证
- **数据绑定**：Spring MVC自动将请求参数绑定到JavaBean属性，支持类型转换。
- **验证**：配合JSR-303 Bean Validation（如`@Valid`、`@NotNull`）进行参数校验。
- **BindingResult**：紧跟在`@Valid`参数后，用于获取验证结果。

### 2.5 拦截器（Interceptor） vs 过滤器（Filter）
| 对比项 | 拦截器（Interceptor） | 过滤器（Filter） |
|--------|----------------------|------------------|
| 归属 | Spring MVC组件，基于Java反射 | Servlet规范组件，基于函数回调 |
| 作用范围 | 只拦截Controller请求 | 拦截所有URL请求（包括静态资源） |
| 配置方式 | 实现`HandlerInterceptor`接口，在Spring配置中注册 | 实现`javax.servlet.Filter`，在web.xml或`@WebFilter`中配置 |
| 访问资源 | 可访问Spring容器中的Bean | 不能直接访问Spring Bean（除非特殊处理） |
| 典型应用 | 权限检查、日志、性能监控 | 字符编码过滤、跨域处理、XSS过滤 |

## 3. Spring Boot

### 3.1 自动配置原理

#### 3.1.1 @SpringBootApplication
这是一个组合注解，包含：
- `@SpringBootConfiguration`：继承自`@Configuration`，表示该类为配置类。
- `@EnableAutoConfiguration`：启用自动配置。
- `@ComponentScan`：启用组件扫描，默认扫描当前包及其子包。

#### 3.1.2 @EnableAutoConfiguration 原理
- 通过`@Import(AutoConfigurationImportSelector.class)`导入配置。
- `AutoConfigurationImportSelector`从`META-INF/spring.factories`（Spring Boot 2.7以前）或`META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`（2.7+）中读取所有自动配置类。
- 自动配置类通常带有`@Conditional`条件注解，根据类路径是否存在某个类、是否配置了某个Bean等条件决定是否生效。

#### 3.1.3 条件注解
| 注解 | 说明 |
|------|------|
| `@ConditionalOnClass` | 当类路径存在指定类时生效 |
| `@ConditionalOnMissingClass` | 当类路径不存在指定类时生效 |
| `@ConditionalOnBean` | 当容器中存在指定Bean时生效 |
| `@ConditionalOnMissingBean` | 当容器中不存在指定Bean时生效 |
| `@ConditionalOnProperty` | 当配置文件中有指定属性且值匹配时生效 |
| `@ConditionalOnWebApplication` | 当前应用为Web应用时生效 |

#### 3.1.4 自动配置示例（以Redis为例）
- `spring.factories`中包含`RedisAutoConfiguration`。
- `RedisAutoConfiguration`通过`@ConditionalOnClass`检测是否有`RedisOperations`类。
- 内部定义`RedisTemplate`和`StringRedisTemplate`，并通过`@ConditionalOnMissingBean`保证用户可以自定义覆盖。

### 3.2 Starter机制

#### 3.2.1 什么是 Starter
Starter是一组预定义的依赖描述，将常用功能打包在一起，方便引入。例如`spring-boot-starter-web`包含Spring MVC、Tomcat、Jackson等依赖。

#### 3.2.2 自定义 Starter 步骤
1. **创建自动配置模块**：新建一个Maven项目，编写自动配置类，并使用`@Configuration`和条件注解。
2. **定义配置属性**：使用`@ConfigurationProperties`绑定配置前缀。
3. **提供 spring.factories 文件**：在`META-INF/spring.factories`中注册自动配置类（Spring Boot 2.7+使用`AutoConfiguration.imports`）。
4. **添加依赖**：将模块打包并发布，其他项目引入即可使用。

**示例**：自定义一个`hello-spring-boot-starter`，提供`HelloService`，可通过配置`hello.name`定制打招呼内容。

### 3.3 配置文件加载顺序
Spring Boot支持多种配置文件，加载优先级从高到低：
1. `bootstrap.yml`（用于Spring Cloud配置中心）
2. `application.properties`或`application.yml`
   - 外部jar包外的`config`子目录
   - 外部jar包所在目录
   - 内部classpath下的`config`目录
   - 内部classpath根目录
3. 命令行参数（最高优先级）

**Profile特定文件**：如`application-dev.yml`，通过`spring.profiles.active`指定。

### 3.4 属性绑定 @ConfigurationProperties
用于将配置文件中的属性绑定到Java Bean。

```java
@Component
@ConfigurationProperties(prefix = "app")
public class AppProperties {
    private String name;
    private int version;
    // getter/setter
}
```

配合`@EnableConfigurationProperties`或在配置类上使用`@ConfigurationPropertiesScan`。

### 3.5 嵌入式Web容器
Spring Boot支持嵌入Tomcat（默认）、Jetty、Undertow。

**切换Web服务器**：
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <exclusions>
        <exclusion>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-tomcat</artifactId>
        </exclusion>
    </exclusions>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-jetty</artifactId>
</dependency>
```

**配置**：通过`server.port`、`server.servlet.context-path`等。

### 3.6 Actuator 监控
Spring Boot Actuator提供生产级的监控和管理端点。

**常用端点**：
| 端点 | 说明 |
|------|------|
| `/health` | 显示应用健康状态 |
| `/info` | 显示自定义应用信息 |
| `/metrics` | 显示内存、线程、GC等指标 |
| `/env` | 显示环境属性 |
| `/beans` | 显示所有Spring Bean |
| `/mappings` | 显示所有URL映射 |
| `/loggers` | 查看和修改日志级别 |

**启用**：引入`spring-boot-starter-actuator`，并通过`management.endpoints.web.exposure.include=*`暴露端点。

---

以上是Spring、Spring MVC、Spring Boot的详细面试资料。深入理解这些核心原理和组件，结合实际项目经验，能够应对资深开发岗位的相关问题。