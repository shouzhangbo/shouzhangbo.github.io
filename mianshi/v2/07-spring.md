# 模块七：Spring 全家桶 ⭐

> 框架层核心，P6/P7 必须掌握 IoC/AOP/事务/自动装配原理

---

## Part 1：Spring Core

### 1. IoC 容器启动流程与 Bean 生命周期 ⭐

#### 1.1 容器启动流程

```java
// ApplicationContext 启动入口
AnnotationConfigApplicationContext ctx = 
    new AnnotationConfigApplicationContext(AppConfig.class);

// 核心方法：AbstractApplicationContext.refresh()
public void refresh() throws BeansException {
    // 1. prepareRefresh()：准备刷新，记录启动时间，设置 active 标志
    // 2. obtainFreshBeanFactory()：创建/刷新 BeanFactory
    // 3. prepareBeanFactory()：配置 BeanFactory（ClassLoader、BeanPostProcessor 等）
    // 4. postProcessBeanFactory()：子类扩展点
    // 5. invokeBeanFactoryPostProcessors()：执行 BeanFactoryPostProcessor
    //    （包括 ConfigurationClassPostProcessor，处理 @Configuration/@Bean/@ComponentScan）
    // 6. registerBeanPostProcessors()：注册 BeanPostProcessor
    // 7. initMessageSource()：国际化
    // 8. initApplicationEventMulticaster()：事件广播器
    // 9. onRefresh()：子类扩展（SpringBoot 在此启动内嵌容器）
    // 10. registerListeners()：注册监听器
    // 11. finishBeanFactoryInitialization()：实例化所有非懒加载单例 Bean
    // 12. finishRefresh()：发布 ContextRefreshedEvent
}
```

#### 1.2 Bean 生命周期 ⭐

```
实例化（Instantiation）
    ↓ 构造函数
属性填充（Populate Properties）
    ↓ @Autowired / setter 注入
Aware 接口回调
    ↓ BeanNameAware.setBeanName()
    ↓ BeanFactoryAware.setBeanFactory()
    ↓ ApplicationContextAware.setApplicationContext()
BeanPostProcessor.postProcessBeforeInitialization()
    ↓ @PostConstruct（CommonAnnotationBeanPostProcessor 处理）
InitializingBean.afterPropertiesSet()
    ↓
自定义 init-method
    ↓
BeanPostProcessor.postProcessAfterInitialization()
    ↓ AOP 代理在此创建（AbstractAutoProxyCreator）
Bean 就绪，放入单例池（singletonObjects）
    ↓
使用中...
    ↓
@PreDestroy
    ↓
DisposableBean.destroy()
    ↓
自定义 destroy-method
```

```java
@Component
public class MyBean implements BeanNameAware, InitializingBean, DisposableBean {
    
    @Autowired
    private DependencyBean dep;  // 属性填充
    
    @Override
    public void setBeanName(String name) {
        System.out.println("BeanNameAware: " + name);
    }
    
    @PostConstruct
    public void postConstruct() {
        System.out.println("@PostConstruct");
    }
    
    @Override
    public void afterPropertiesSet() {
        System.out.println("InitializingBean.afterPropertiesSet");
    }
    
    @PreDestroy
    public void preDestroy() {
        System.out.println("@PreDestroy");
    }
    
    @Override
    public void destroy() {
        System.out.println("DisposableBean.destroy");
    }
}
```

### 2. AOP 实现原理

#### 2.1 AOP 核心概念

| 概念 | 说明 |
|------|------|
| Aspect（切面） | 横切关注点的模块化（如日志、事务） |
| Pointcut（切点） | 定义在哪些方法上织入（表达式） |
| Advice（通知） | 在切点处执行的代码（Before/After/Around） |
| JoinPoint（连接点） | 程序执行的某个点（方法调用） |
| Weaving（织入） | 将切面应用到目标对象的过程 |

#### 2.2 Spring AOP 实现

```java
@Aspect
@Component
public class LogAspect {
    
    // 切点表达式
    @Pointcut("execution(* com.example.service.*.*(..))")
    public void serviceLayer() {}
    
    @Before("serviceLayer()")
    public void before(JoinPoint jp) {
        System.out.println("Before: " + jp.getSignature().getName());
    }
    
    @Around("serviceLayer()")
    public Object around(ProceedingJoinPoint pjp) throws Throwable {
        long start = System.currentTimeMillis();
        try {
            return pjp.proceed();
        } finally {
            System.out.println("耗时: " + (System.currentTimeMillis() - start) + "ms");
        }
    }
    
    @AfterThrowing(pointcut = "serviceLayer()", throwing = "ex")
    public void afterThrowing(Exception ex) {
        System.out.println("异常: " + ex.getMessage());
    }
}
```

**织入时机**：Spring AOP 是**运行时织入**，通过 `BeanPostProcessor.postProcessAfterInitialization` 创建代理对象。

### 3. 循环依赖解决方案（三级缓存）⭐

#### 3.1 三级缓存结构

```java
// DefaultSingletonBeanRegistry
// 一级缓存：完整的单例 Bean
Map<String, Object> singletonObjects = new ConcurrentHashMap<>();

// 二级缓存：早期暴露的 Bean（已实例化但未完成属性填充）
Map<String, Object> earlySingletonObjects = new HashMap<>();

// 三级缓存：Bean 工厂（用于创建代理对象）
Map<String, ObjectFactory<?>> singletonFactories = new HashMap<>();
```

#### 3.2 循环依赖解决流程

```
A 依赖 B，B 依赖 A

1. 创建 A：实例化 A（构造函数）
2. 将 A 的 ObjectFactory 放入三级缓存
3. 填充 A 的属性，发现需要 B
4. 创建 B：实例化 B
5. 将 B 的 ObjectFactory 放入三级缓存
6. 填充 B 的属性，发现需要 A
7. 从三级缓存获取 A 的 ObjectFactory，调用 getObject() 得到早期 A（可能是代理）
8. 将早期 A 放入二级缓存，删除三级缓存中的 A
9. B 完成属性填充和初始化，放入一级缓存
10. A 完成属性填充（注入了 B），初始化，放入一级缓存
```

**为什么需要三级缓存？**

三级缓存的 `ObjectFactory` 是为了支持 AOP 代理。如果 A 需要被代理，在循环依赖中需要提前创建代理对象（而不是在 `postProcessAfterInitialization` 中创建），三级缓存的工厂方法负责这个逻辑。

**不能解决的循环依赖**：
- 构造器注入的循环依赖（实例化阶段就需要依赖，无法提前暴露）
- `@Scope("prototype")` 的循环依赖（原型 Bean 不缓存）

### 4. 事务管理原理与传播行为 ⭐

#### 4.1 事务实现原理

```java
// Spring 事务基于 AOP 实现
// TransactionInterceptor 是核心拦截器

@Transactional
public void transfer(Long fromId, Long toId, BigDecimal amount) {
    // 1. TransactionInterceptor.invoke() 被调用
    // 2. 根据 @Transactional 属性创建/获取事务
    // 3. 执行业务方法
    // 4. 正常返回：提交事务
    // 5. 抛出异常：回滚事务（默认只回滚 RuntimeException 和 Error）
}
```

#### 4.2 七种传播行为

| 传播行为 | 说明 | 使用场景 |
|----------|------|----------|
| `REQUIRED`（默认） | 有事务则加入，没有则新建 | 通用 |
| `REQUIRES_NEW` | 总是新建事务，挂起当前事务 | 日志记录（不受外部事务影响） |
| `SUPPORTS` | 有事务则加入，没有则非事务执行 | 查询方法 |
| `NOT_SUPPORTED` | 非事务执行，挂起当前事务 | 不需要事务的操作 |
| `MANDATORY` | 必须在事务中执行，否则抛异常 | 必须由调用方开启事务 |
| `NEVER` | 不能在事务中执行，否则抛异常 | 禁止事务 |
| `NESTED` | 嵌套事务（保存点），外部回滚影响内部，内部回滚不影响外部 | 部分回滚 |

#### 4.3 ⭐ 事务失效场景

```java
// 场景1：同类内部调用（绕过代理）
@Service
public class OrderService {
    
    @Transactional
    public void createOrder() {
        // ...
        this.sendNotification();  // 直接调用，不经过代理，事务不生效！
    }
    
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void sendNotification() { ... }
    
    // 解决：注入自身代理，或将方法移到另一个 Bean
    @Autowired
    private OrderService self;  // 注入代理
    self.sendNotification();    // 通过代理调用
}

// 场景2：方法不是 public
@Transactional
private void doSomething() { ... }  // 事务不生效

// 场景3：异常被捕获
@Transactional
public void method() {
    try {
        // ...
    } catch (Exception e) {
        // 异常被吞掉，事务不回滚
        log.error("error", e);
    }
}

// 场景4：非 RuntimeException 不回滚（默认）
@Transactional
public void method() throws Exception {
    throw new Exception("checked exception");  // 不回滚！
    // 解决：@Transactional(rollbackFor = Exception.class)
}

// 场景5：多数据源事务
// 不同数据源的操作不在同一事务中
```

---

## Part 2：Spring MVC

### 5. DispatcherServlet 请求处理流程

```
HTTP 请求
    ↓
DispatcherServlet.doDispatch()
    ↓
HandlerMapping.getHandler()
    → 返回 HandlerExecutionChain（Handler + Interceptors）
    ↓
HandlerAdapter.handle()
    → 执行 Interceptor.preHandle()
    → 执行 Handler（Controller 方法）
    → 执行 Interceptor.postHandle()
    → 返回 ModelAndView
    ↓
ViewResolver.resolveViewName()
    → 解析视图名称为 View 对象
    ↓
View.render()
    → 渲染视图，写入响应
    ↓
Interceptor.afterCompletion()
    ↓
HTTP 响应
```

### 6. 过滤器 vs 拦截器 vs AOP

| 维度 | Filter（过滤器） | Interceptor（拦截器） | AOP |
|------|----------------|---------------------|-----|
| 规范 | Servlet 规范 | Spring MVC | Spring |
| 作用范围 | 所有请求 | DispatcherServlet 处理的请求 | Spring Bean 方法 |
| 执行顺序 | 最外层 | 中间层 | 最内层 |
| 获取 Spring Bean | 困难（需 WebApplicationContextUtils） | 容易（Spring 管理） | 容易 |
| 适用场景 | 编码/跨域/安全认证 | 登录校验/权限/日志 | 业务逻辑增强 |

---

## Part 3：Spring Boot

### 7. 自动装配原理 ⭐

```java
// @SpringBootApplication 包含：
@SpringBootConfiguration  // 等同于 @Configuration
@EnableAutoConfiguration  // 开启自动装配
@ComponentScan            // 扫描当前包及子包

// @EnableAutoConfiguration 核心：
@Import(AutoConfigurationImportSelector.class)

// AutoConfigurationImportSelector.selectImports() 流程：
// 1. 读取 META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
//    （Spring Boot 3.x，2.x 是 spring.factories）
// 2. 过滤：@ConditionalOnClass、@ConditionalOnMissingBean 等条件注解
// 3. 返回满足条件的自动配置类列表
```

**自定义 Starter**：

```java
// 1. 创建自动配置类
@Configuration
@ConditionalOnClass(RedisTemplate.class)  // classpath 有 RedisTemplate 才生效
@EnableConfigurationProperties(MyProperties.class)
public class MyAutoConfiguration {
    
    @Bean
    @ConditionalOnMissingBean  // 用户没有自定义才创建
    public MyService myService(MyProperties properties) {
        return new MyService(properties);
    }
}

// 2. 注册自动配置类
// META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
// com.example.MyAutoConfiguration

// 3. 配置属性
@ConfigurationProperties(prefix = "my.service")
public class MyProperties {
    private String host = "localhost";
    private int port = 8080;
}
```

### 8. Starter 机制设计

```
spring-boot-starter-web 依赖链：
spring-boot-starter-web
    ├── spring-boot-starter（核心）
    │   ├── spring-boot-autoconfigure（自动配置）
    │   └── spring-boot-starter-logging（日志）
    ├── spring-webmvc（Spring MVC）
    └── spring-boot-starter-tomcat（内嵌 Tomcat）
```

### 9. 内嵌容器原理

```java
// Spring Boot 启动时，在 onRefresh() 中创建内嵌容器
// TomcatServletWebServerFactory.getWebServer()
// → 创建 Tomcat 实例
// → 配置 Connector、Engine、Host、Context
// → 注册 DispatcherServlet
// → 启动 Tomcat

// 关键：DispatcherServletAutoConfiguration 自动注册 DispatcherServlet
@Bean
@ConditionalOnMissingBean(value = DispatcherServlet.class)
public DispatcherServlet dispatcherServlet() {
    return new DispatcherServlet();
}
```

---

## Part 4：MyBatis

### 10. 执行流程与核心组件

```
MyBatis 执行流程：

SqlSessionFactory（全局单例）
    ↓ openSession()
SqlSession
    ↓ getMapper()
Mapper 代理（MapperProxy）
    ↓ 调用方法
MappedStatement（SQL 映射）
    ↓
Executor（执行器）
    ├── SimpleExecutor：每次创建新 Statement
    ├── ReuseExecutor：复用 Statement
    └── BatchExecutor：批量执行
    ↓
StatementHandler（处理 Statement）
    ↓
ParameterHandler（处理参数）
    ↓
ResultSetHandler（处理结果集）
    ↓
TypeHandler（Java 类型 ↔ JDBC 类型）
```

### 11. 一级缓存 / 二级缓存

```java
// 一级缓存（SqlSession 级别，默认开启）
// 同一 SqlSession 内，相同 SQL 和参数的查询直接返回缓存结果
// 失效：执行 update/insert/delete、调用 clearCache()、SqlSession 关闭

// 二级缓存（Mapper 级别，需手动开启）
// 同一 Mapper 的不同 SqlSession 共享缓存
// 开启方式：
// 1. mybatis-config.xml: <setting name="cacheEnabled" value="true"/>
// 2. Mapper.xml: <cache/>
// 3. 实体类实现 Serializable

// 注意：二级缓存在分布式环境下可能导致数据不一致，生产中慎用
// 推荐：使用 Redis 作为分布式缓存替代 MyBatis 二级缓存
```

### 12. 插件（Interceptor）扩展原理

```java
// MyBatis 插件基于 JDK 动态代理
// 可拦截的对象：Executor、StatementHandler、ParameterHandler、ResultSetHandler

@Intercepts({
    @Signature(type = StatementHandler.class, method = "prepare", 
               args = {Connection.class, Integer.class})
})
public class PagePlugin implements Interceptor {
    
    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        StatementHandler handler = (StatementHandler) invocation.getTarget();
        BoundSql boundSql = handler.getBoundSql();
        String sql = boundSql.getSql();
        
        // 修改 SQL，添加分页
        String pageSql = sql + " LIMIT " + offset + ", " + pageSize;
        // 通过反射修改 BoundSql 中的 sql 字段
        Field field = BoundSql.class.getDeclaredField("sql");
        field.setAccessible(true);
        field.set(boundSql, pageSql);
        
        return invocation.proceed();
    }
}
```

### 13. 与 Spring 整合原理

```java
// MapperScannerConfigurer 扫描 Mapper 接口
// → 为每个 Mapper 接口创建 MapperFactoryBean
// → MapperFactoryBean.getObject() 返回 MapperProxy 代理对象
// → 代理对象注册为 Spring Bean

// SqlSessionTemplate：线程安全的 SqlSession 实现
// → 每次操作从 Spring 事务上下文获取 SqlSession
// → 保证 MyBatis 事务与 Spring 事务集成
```

---

## 高频面试真题

### Q1：Spring Bean 的生命周期？

**答题框架**：
实例化（构造函数）→ 属性填充（@Autowired）→ Aware 接口回调 → BeanPostProcessor.before → @PostConstruct → afterPropertiesSet → init-method → BeanPostProcessor.after（AOP 代理在此创建）→ 使用 → @PreDestroy → destroy → destroy-method

### Q2：Spring 如何解决循环依赖？

**答题框架**：
- 三级缓存：singletonObjects（完整Bean）、earlySingletonObjects（早期Bean）、singletonFactories（Bean工厂）
- 流程：A 实例化后将工厂放入三级缓存 → 填充属性时发现需要 B → 创建 B → B 需要 A → 从三级缓存获取 A 的早期引用 → B 完成 → A 完成
- 三级缓存的意义：支持 AOP 代理（工厂方法可以返回代理对象）
- 不能解决：构造器注入循环依赖、prototype 循环依赖

### Q3：Spring 事务的传播行为有哪些？事务失效的场景？

**答题框架**：
- 7种传播行为：REQUIRED（默认）、REQUIRES_NEW、SUPPORTS、NOT_SUPPORTED、MANDATORY、NEVER、NESTED
- 失效场景：同类内部调用（绕过代理）、非 public 方法、异常被捕获、非 RuntimeException 未配置 rollbackFor、多数据源

### Q4：Spring Boot 自动装配的原理？

**答题框架**：
- @EnableAutoConfiguration → AutoConfigurationImportSelector
- 读取 spring.factories（2.x）或 AutoConfiguration.imports（3.x）中的自动配置类列表
- 通过 @Conditional 系列注解过滤（@ConditionalOnClass、@ConditionalOnMissingBean 等）
- 满足条件的配置类生效，自动创建 Bean

### Q5：MyBatis 的一级缓存和二级缓存的区别？

**答题框架**：
- 一级缓存：SqlSession 级别，默认开启，同一 Session 内相同查询复用结果，Session 关闭或执行写操作后失效
- 二级缓存：Mapper 级别，需手动开启，跨 Session 共享，事务提交后才写入缓存
- 生产建议：二级缓存在分布式环境下有数据一致性问题，推荐用 Redis 替代

---

## 学习建议

**备考重点**：Bean 生命周期（必考）、循环依赖三级缓存（必考）、事务传播行为和失效场景（必考）、Spring Boot 自动装配（必考）

**推荐资源**：
- Spring 官方文档：https://docs.spring.io/spring-framework/docs/current/reference/html/
- 《Spring 源码深度解析》（郝佳）
- Spring 源码：`AbstractApplicationContext.refresh()`、`DefaultSingletonBeanRegistry`、`AbstractAutoProxyCreator`
