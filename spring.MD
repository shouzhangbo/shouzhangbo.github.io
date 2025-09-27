# Spring、Spring MVC、Spring Boot 核心面试题及答案


## 一、Spring Core（核心容器）
### 1. 什么是 IoC（控制反转）？Spring IoC 容器的两种核心实现（BeanFactory 和 ApplicationContext）有什么区别？
**答案**：
- **IoC 定义**：控制反转是将对象的创建、依赖管理、生命周期控制从业务代码转移到 Spring 容器的设计思想，核心是“解耦”—— 业务代码不再主动 new 对象，而是由容器“注入”依赖对象。
- **BeanFactory 与 ApplicationContext 区别**：  
  | 维度                | BeanFactory                          | ApplicationContext                          |
  |---------------------|--------------------------------------|---------------------------------------------|
  | 加载方式            | 懒加载（调用 `getBean()` 时才实例化 Bean） | 预加载（容器初始化时主动实例化单例 Bean）   |
  | 功能范围            | 基础功能（Bean 实例化、依赖注入）    | 继承 BeanFactory 所有功能，扩展：AOP 集成、国际化、事件发布、资源加载 |
  | 核心实现类          | `DefaultListableBeanFactory`         | `ClassPathXmlApplicationContext`、`AnnotationConfigApplicationContext` |
  | 适用场景            | 资源受限环境（如移动端）              | 绝大多数企业级应用（Web 开发、服务端开发）  |


### 2. Spring 依赖注入（DI）有哪三种实现方式？各有什么优缺点？如何解决循环依赖问题？
**答案**：
- **三种注入方式对比**：
    1. **构造器注入**
        - 实现：通过类的构造方法参数注入依赖，用 `@Autowired` 标注构造器（Spring 4.3+ 单构造器可省略）。
        - 优点：强制依赖（必须注入，避免空指针）；支持不可变对象（`final` 字段）。
        - 缺点：依赖过多时构造方法参数冗长。
        - 场景：核心依赖（如 `Service` 依赖 `Repository`）。

    2. **setter 注入**
        - 实现：通过类的 setter 方法注入依赖，用 `@Autowired` 标注 setter 方法。
        - 优点：可选依赖（可不注入）；灵活性高。
        - 缺点：依赖可被后续修改；需额外编写 setter 方法。
        - 场景：可选依赖（如 `Service` 依赖工具类）。

    3. **字段注入**
        - 实现：直接在类的成员变量上标注 `@Autowired`。
        - 优点：代码简洁，无额外方法。
        - 缺点：无法注入 `final` 字段；依赖隐藏（可读性差）；不支持构造器强制依赖。
        - 场景：简单场景（如 `Controller` 依赖 `Service`）。

- **循环依赖解决**：  
  Spring 仅支持 **单例 Bean** 的循环依赖（如 A 依赖 B，B 依赖 A），通过“三级缓存”实现：
    1. 一级缓存（`singletonObjects`）：存储完全初始化完成的单例 Bean。
    2. 二级缓存（`earlySingletonObjects`）：存储“提前暴露”的未完全初始化 Bean（仅实例化，未注入属性）。
    3. 三级缓存（`singletonFactories`）：存储 Bean 工厂，用于生成未完全初始化的 Bean 引用。  
       流程：A 实例化后存入三级缓存 → 注入 B 时发现 B 未创建 → B 实例化后存入三级缓存 → 注入 A 时从三级缓存获取 A 的提前引用 → B 初始化完成存入一级缓存 → A 注入 B 后初始化完成存入一级缓存。  
       注意：原型 Bean 无法解决循环依赖（每次 `getBean()` 新建实例，会无限循环，抛 `BeanCurrentlyInCreationException`）。


### 3. 请详细描述 Spring Bean 的完整生命周期，以及各阶段可扩展的接口有哪些？
**答案**：  
Spring Bean 生命周期分 8 个阶段，核心是“实例化 → 注入 → 初始化 → 销毁”：
1. **实例化（Instantiation）**：Spring 调用 Bean 的无参构造器（或工厂方法）创建 Bean 实例（仅分配内存，未设置属性）。
2. **属性注入（Populate）**：Spring 为 Bean 的成员变量赋值（依赖注入，调用 setter 方法或直接赋值字段）。
3. **初始化前（PostProcessBeforeInitialization）**：调用所有 `BeanPostProcessor` 的 `postProcessBeforeInitialization` 方法（如 `@Autowired` 注解解析、AOP 代理前置处理）。
4. **初始化（Initialization）**：
    - 若 Bean 实现 `InitializingBean` 接口，调用 `afterPropertiesSet()` 方法。
    - 执行自定义初始化方法（XML 配置 `init-method` 或注解 `@PostConstruct`）。
5. **初始化后（PostProcessAfterInitialization）**：调用所有 `BeanPostProcessor` 的 `postProcessAfterInitialization` 方法（如 AOP 动态代理生成，此时返回的可能是代理对象）。
6. **就绪（Ready）**：Bean 存入容器，供应用调用（单例 Bean 存于 `singletonObjects` 缓存）。
7. **销毁前（PreDestroy）**：
    - 若 Bean 实现 `DisposableBean` 接口，调用 `destroy()` 方法。
    - 执行自定义销毁方法（XML 配置 `destroy-method` 或注解 `@PreDestroy`）。
8. **销毁（Destruction）**：容器关闭时，释放 Bean 占用资源（如数据库连接、文件流）。

- **可扩展接口**：
    - 实例化后注入前：`BeanNameAware`（获取 Bean 名称）、`BeanFactoryAware`（获取容器引用）。
    - 初始化前后：`BeanPostProcessor`（全局 Bean 增强）、`InitializingBean`（自定义初始化逻辑）。
    - 销毁前：`DisposableBean`（自定义销毁逻辑）、`ApplicationContextAware`（获取应用上下文）。


### 4. Spring AOP 的核心概念有哪些？动态代理的两种实现方式（JDK 和 CGLIB）有什么区别？如何解决 AOP 自调用问题？
**答案**：
- **AOP 核心概念**：
    1. 切面（Aspect）：封装横切逻辑的类（如日志切面），用 `@Aspect` 标注。
    2. 连接点（JoinPoint）：程序执行中的“候选点”（Spring AOP 仅支持“方法执行”）。
    3. 切点（Pointcut）：从连接点中筛选的“目标点”（如 `execution(* com.xxx.service.*.*(..))`），用 `@Pointcut` 定义。
    4. 通知（Advice）：切面在切点处执行的逻辑，分 5 种：
        - 前置通知（`@Before`）：目标方法执行前。
        - 后置通知（`@After`）：目标方法执行后（无论是否异常）。
        - 返回通知（`@AfterReturning`）：目标方法正常返回后。
        - 异常通知（`@AfterThrowing`）：目标方法抛出异常后。
        - 环绕通知（`@Around`）：目标方法执行前后（可控制方法执行、修改返回值）。
    5. 引入（Introduction）：为目标类动态添加新接口和实现（如为 `UserService` 加 `Loggable` 接口）。

- **动态代理两种方式区别**：  
  | 维度                | JDK 动态代理                          | CGLIB 动态代理                          |
  |---------------------|--------------------------------------|-----------------------------------------|
  | 原理                | 基于接口生成代理类（实现 `InvocationHandler`） | 基于继承生成代理类（动态生成目标类子类） |
  | 依赖                | JDK 原生支持（无需额外依赖）          | 依赖 CGLIB 库（Spring 内置）            |
  | 目标类要求          | 必须实现接口                          | 无需实现接口（可代理普通类）            |
  | 代理限制            | 无法代理无接口的类、final 方法        | 无法代理 final 类、final 方法           |
  | 触发条件            | 目标类实现接口时                      | 目标类无接口；或配置 `proxy-target-class=true` |

- **AOP 自调用问题及解决**：
    - **问题**：代理对象调用自身非代理方法（如 `A.method1()` 调用 `A.method2()`，`method2` 的 AOP 通知不生效）。原因是自调用未经过代理对象，直接调用目标对象方法，无法触发通知。
    - **解决**：
        1. 从 Spring 容器中获取自身代理对象（如注入 `ApplicationContext`，调用 `getBean(A.class)`）。
        2. 使用 `@EnableAspectJAutoProxy(exposeProxy = true)`，通过 `AopContext.currentProxy()` 获取当前代理对象。  
           示例：
      ```java
      @Service
      public class A {
          public void method1() {
              // 获取代理对象调用 method2
              ((A) AopContext.currentProxy()).method2();
          }
          @Transactional // 通知生效
          public void method2() { ... }
      }
      ```


### 5. Spring 事务管理中，@Transactional 的核心参数有哪些？哪些场景下事务会不生效？
**答案**：
- **@Transactional 核心参数**：
    1. **propagation（传播行为）**：控制事务嵌套行为，常用：
        - `REQUIRED`（默认）：无事务则新建，有事务则加入（如“新增用户+新增订单”用此）。
        - `REQUIRES_NEW`：无论有无事务，都新建事务（原事务挂起，如“日志记录”独立事务）。
        - `SUPPORTS`：有事务则加入，无则无事务（如查询方法）。
    2. **isolation（隔离级别）**：控制事务并发隔离程度，对应数据库隔离级别：
        - `DEFAULT`（默认）：继承数据库默认（MySQL 默认为 `REPEATABLE READ`）。
        - `READ_COMMITTED`：仅读已提交数据（解决脏读）。
        - `REPEATABLE_READ`：同一事务多次读同一数据一致（解决脏读、不可重复读）。
    3. **rollbackFor**：指定触发回滚的异常类型（默认仅 `RuntimeException` 和 `Error` 回滚，如 `rollbackFor = Exception.class`）。
    4. **timeout**：事务超时时间（单位：秒，超时后回滚，如 `timeout = 3`）。
    5. **readOnly**：是否只读事务（优化数据库性能，写操作设为 `true` 会抛异常）。

- **事务不生效的 7 种场景**：
    1. **非 public 方法**：Spring AOP 默认仅代理 `public` 方法，`private/protected/default` 方法的 `@Transactional` 无效。
    2. **自调用问题**：代理对象调用自身非代理方法（如 `A.method1()` 调用 `A.method2()`，`method2` 事务不生效）。
    3. **异常被捕获**：业务方法内捕获异常且未重新抛出（如 `try { ... } catch (Exception e) { log.error(...) }`，事务无法感知异常）。
    4. **错误的异常类型**：抛出 `checked` 异常（如 `IOException`），且未通过 `rollbackFor` 指定，事务不回滚。
    5. **未配置事务管理器**：未注入 `DataSourceTransactionManager` 或 `JpaTransactionManager`，Spring 无法管理事务。
    6. **传播行为错误**：如设置为 `NOT_SUPPORTED`（无事务执行）或 `NEVER`（有事务则抛异常）。
    7. **多数据源场景**：未指定事务管理器（需通过 `@Transactional(value = "txManager2")` 绑定对应数据源的事务管理器）。


## 二、Spring MVC（Web 框架）
### 1. 请描述 Spring MVC 处理一次 HTTP 请求的完整流程，核心组件有哪些？
**答案**：
- **完整请求流程（12 步）**：
    1. 客户端发送 HTTP 请求（如 `GET /user/1`），经 Tomcat 容器转发至 `DispatcherServlet`（前端控制器）。
    2. `DispatcherServlet` 调用 `HandlerMapping`（处理器映射），根据请求 URL 查找匹配的 `HandlerMethod`（控制器方法）。
    3. `HandlerMapping` 返回 `HandlerMethod` 给 `DispatcherServlet`。
    4. `DispatcherServlet` 调用 `HandlerAdapter`（处理器适配器），适配 `HandlerMethod`（处理参数绑定、返回值解析）。
    5. `HandlerAdapter` 执行参数绑定：解析 `@RequestParam`、`@RequestBody` 等注解，将请求参数转为 `HandlerMethod` 的方法参数。
    6. `HandlerAdapter` 调用目标 `HandlerMethod`（如 `UserController.getUser(1)`），执行业务逻辑。
    7. `HandlerMethod` 返回结果（如 `ModelAndView`、`String` 视图名、JSON 数据）。
    8. `HandlerAdapter` 将返回结果返回给 `DispatcherServlet`。
    9. `DispatcherServlet` 调用 `ViewResolver`（视图解析器），将逻辑视图名（如 `"user"`）解析为物理视图（如 `/WEB-INF/views/user.jsp`）。
    10. `ViewResolver` 返回 `View` 对象给 `DispatcherServlet`。
    11. `DispatcherServlet` 调用 `View` 的 `render()` 方法，渲染视图（将模型数据填入视图，生成 HTML）。
    12. `DispatcherServlet` 将渲染后的响应返回给客户端。

- **核心组件及职责**：  
  | 组件                | 职责                                  | 核心实现类                          |
  |---------------------|---------------------------------------|-------------------------------------|
  | DispatcherServlet   | 前端控制器，协调所有组件              | `org.springframework.web.servlet.DispatcherServlet` |
  | HandlerMapping      | 映射请求 URL 到 HandlerMethod         | `RequestMappingHandlerMapping`      |
  | HandlerAdapter      | 适配 HandlerMethod，处理参数绑定      | `RequestMappingHandlerAdapter`      |
  | ViewResolver        | 解析逻辑视图名为物理视图              | `InternalResourceViewResolver`（JSP）、`ThymeleafViewResolver` |
  | HandlerExceptionResolver | 处理请求过程中的异常              | `ExceptionHandlerExceptionResolver`（支持 `@ExceptionHandler`） |


### 2. Spring MVC 中，@RequestParam、@PathVariable、@RequestBody 三种参数绑定注解的区别是什么？如何实现自定义参数转换器？
**答案**：
- **三种注解区别**：  
  | 注解                | 作用场景                          | 数据来源                          | 示例                          |
  |---------------------|-----------------------------------|-----------------------------------|-------------------------------|
  | @RequestParam       | 绑定 URL  query 参数、表单参数     | 请求行（`?name=张三`）、请求体（表单） | `@GetMapping("/user")` + `@RequestParam("name") String name` |
  | @PathVariable       | 绑定 URL 路径中的占位符（RESTful 风格） | URL 路径（`/user/{id}`）          | `@GetMapping("/user/{id}")` + `@PathVariable("id") int id` |
  | @RequestBody        | 绑定请求体中的 JSON/XML 数据       | 请求体（`Content-Type: application/json`） | `@PostMapping("/user")` + `@RequestBody User user` |

- **自定义参数转换器实现**：  
  场景：将请求参数（如 String 类型的 `"2024-05-20"`）转为自定义类型（如 `LocalDate`）。  
  步骤：
    1. 实现 `Converter<S, T>` 接口（`S` 为源类型，`T` 为目标类型）：
       ```java
       // String → LocalDate 转换器
       public class StringToLocalDateConverter implements Converter<String, LocalDate> {
           @Override
           public LocalDate convert(String source) {
               if (source == null || source.isEmpty()) {
                   return null;
               }
               // 解析日期格式（如 "2024-05-20"）
               return LocalDate.parse(source, DateTimeFormatter.ISO_LOCAL_DATE);
           }
       }
       ```  
    2. 注册转换器到 Spring MVC 容器（通过 `WebMvcConfigurer`）：
       ```java
       @Configuration
       public class WebMvcConfig implements WebMvcConfigurer {
           @Override
           public void addFormatters(FormatterRegistry registry) {
               // 注册自定义转换器
               registry.addConverter(new StringToLocalDateConverter());
           }
       }
       ```  
    3. 使用：直接在控制器方法中绑定 `LocalDate` 类型参数，Spring 自动调用转换器：
       ```java
       @GetMapping("/order")
       public String getOrderByDate(LocalDate date) { // 自动解析 "2024-05-20" 为 LocalDate
           return "orderList";
       }
       ```


### 3. Spring MVC 的拦截器（Interceptor）与 Servlet 过滤器（Filter）有什么区别？如何配置拦截器？
**答案**：
- **拦截器与过滤器区别**：  
  | 维度                | 拦截器（Interceptor）                | 过滤器（Filter）                      |
  |---------------------|---------------------------------------|---------------------------------------|
  | 技术依赖            | Spring MVC 框架                      | Servlet 规范                          |
  | 执行时机            | DispatcherServlet 之后，Handler 之前 | Tomcat 接收请求后，DispatcherServlet 之前 |
  | 拦截范围            | 仅 Spring MVC 管理的请求（如 @Controller 方法） | 所有请求（包括静态资源、JSP、非 Spring 管理的 Servlet） |
  | 注入能力            | 可直接注入 Spring Bean（如 Service）  | 不可直接注入 Spring Bean（需通过 `WebApplicationContextUtils` 获取） |
  | 执行粒度            | 方法级（可获取 HandlerMethod、ModelAndView） | 请求级（仅能获取 ServletRequest、ServletResponse） |
  | 异常处理            | 可处理 Handler 抛出的异常            | 无法处理 Handler 异常（执行时机早）  |
  | 生命周期            | 随 Spring 容器创建/销毁              | 随 Servlet 容器创建/销毁              |

- **拦截器配置步骤**：
    1. 实现 `HandlerInterceptor` 接口（或继承 `HandlerInterceptorAdapter`，Spring 5+ 推荐直接实现接口）：
       ```java
       public class LoginInterceptor implements HandlerInterceptor {
           // 目标方法执行前（返回 true 继续，false 中断）
           @Override
           public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
               // 示例：未登录则重定向到登录页
               HttpSession session = request.getSession();
               if (session.getAttribute("user") == null) {
                   response.sendRedirect("/login");
                   return false;
               }
               return true;
           }
  
           // 目标方法执行后，视图渲染前
           @Override
           public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) throws Exception {
               // 可修改模型数据（如添加公共属性）
               if (modelAndView != null) {
                   modelAndView.addObject("currentTime", LocalDateTime.now());
               }
           }
  
           // 视图渲染后，请求完成
           @Override
           public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
               // 资源清理（如关闭流）
           }
       }
       ```  
    2. 通过 `WebMvcConfigurer` 注册拦截器，指定拦截/排除路径：
       ```java
       @Configuration
       public class WebMvcConfig implements WebMvcConfigurer {
           @Override
           public void addInterceptors(InterceptorRegistry registry) {
               registry.addInterceptor(new LoginInterceptor())
                       .addPathPatterns("/**") // 拦截所有请求
                       .excludePathPatterns("/login", "/register", "/static/**"); // 排除登录、注册、静态资源
           }
       }
       ```


### 4. Spring MVC 如何实现全局异常处理？如何自定义业务异常并返回自定义错误码？
**答案**：
- **全局异常处理实现（推荐 @ControllerAdvice + @ExceptionHandler）**：  
  作用：统一处理所有 `@Controller` 抛出的异常，无代码侵入，便于维护。  
  示例：
  ```java
  // 全局异常处理器（扫描所有 @Controller 类）
  @ControllerAdvice
  public class GlobalExceptionHandler {
      // 1. 处理特定异常（如 NullPointerException）
      @ExceptionHandler(NullPointerException.class)
      @ResponseBody // 返回 JSON（前后端分离场景）
      @ResponseStatus(HttpStatus.BAD_REQUEST) // 设置响应状态码（400）
      public Result<?> handleNullPointerException(NullPointerException e) {
          // 统一响应体（code：错误码，message：错误信息，data：null）
          return Result.fail(400, "空指针异常：" + e.getMessage());
      }

      // 2. 处理自定义业务异常（见下文）
      @ExceptionHandler(BusinessException.class)
      @ResponseBody
      public Result<?> handleBusinessException(BusinessException e) {
          // 返回自定义错误码和消息
          return Result.fail(e.getCode(), e.getMessage());
      }

      // 3. 兜底处理：捕获所有未定义的异常（如 Exception）
      @ExceptionHandler(Exception.class)
      @ResponseBody
      @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR) // 500 状态码
      public Result<?> handleException(Exception e) {
          // 生产环境建议隐藏具体异常信息，避免泄露敏感数据
          return Result.fail(500, "系统异常，请联系管理员");
      }
  }

  // 统一响应体封装（通用类）
  @Data
  public class Result<T> {
      private int code; // 0：成功，非0：失败
      private String message;
      private T data;

      // 成功响应（带数据）
      public static <T> Result<T> success(T data) {
          Result<T> result = new Result<>();
          result.setCode(0);
          result.setMessage("success");
          result.setData(data);
          return result;
      }

      // 失败响应（自定义错误码和消息）
      public static <T> Result<T> fail(int code, String message) {
          Result<T> result = new Result<>();
          result.setCode(code);
          result.setMessage(message);
          result.setData(null);
          return result;
      }
  }
  ```  

- **自定义业务异常实现**：  
  场景：业务错误（如“用户不存在”“余额不足”），需返回自定义错误码（如 1001、1002）。  
  步骤：
    1. 定义业务异常类（继承 `RuntimeException`，携带错误码和消息）：
       ```java
       public class BusinessException extends RuntimeException {
           private int code; // 自定义错误码
  
           // 构造方法
           public BusinessException(int code, String message) {
               super(message);
               this.code = code;
           }
  
           // getter
           public int getCode() {
               return code;
           }
       }
       ```  
    2. 业务代码中抛出异常：
       ```java
       @Service
       public class UserService {
           public User getUserById(int id) {
               User user = userRepository.findById(id);
               if (user == null) {
                   // 抛出业务异常（错误码 1001：用户不存在）
                   throw new BusinessException(1001, "用户不存在：id=" + id);
               }
               return user;
           }
       }
       ```  
    3. 全局异常处理器捕获并返回响应：  
       如上文 `GlobalExceptionHandler` 中的 `handleBusinessException` 方法，最终返回 JSON：
       ```json
       {
         "code": 1001,
         "message": "用户不存在：id=123",
         "data": null
       }
       ```


## 三、Spring Boot（快速开发框架）
### 1. Spring Boot 的自动配置原理是什么？@SpringBootApplication 注解包含哪些核心注解？
**答案**：
- **自动配置核心原理**：  
  Spring Boot 自动配置是“约定大于配置”的实现，核心是“扫描自动配置类 → 条件判断生效 → 注册 Bean 到容器”，流程如下：
    1. **入口注解 @SpringBootApplication**：是复合注解，包含 3 个核心注解（见下文），开启自动配置和组件扫描。
    2. **@EnableAutoConfiguration 触发自动配置**：
        - 该注解导入 `AutoConfigurationImportSelector` 类，其 `getCandidateConfigurations()` 方法加载 `META-INF/spring.factories` 文件中的自动配置类（如 `DataSourceAutoConfiguration`、`WebMvcAutoConfiguration`）。
        - `spring.factories` 是 Spring Boot 自动配置的“配置清单”，记录了所有候选自动配置类的全类名。
    3. **条件注解判断是否生效**：  
       自动配置类通过“条件注解”判断是否需要生效（避免不必要的 Bean 注册），常用条件注解：
        - `@ConditionalOnClass`：类路径下存在指定类时生效（如 `DataSourceAutoConfiguration` 需 `DataSource` 类）。
        - `@ConditionalOnMissingBean`：容器中不存在指定 Bean 时生效（如用户未自定义 `DataSource` 时，自动配置默认 `DataSource`）。
        - `@ConditionalOnProperty`：配置文件中存在指定属性且值匹配时生效（如 `spring.datasource.enabled=true`）。
    4. **注册 Bean 并绑定配置**：  
       生效的自动配置类通过 `@Bean` 注册相关 Bean 到容器（如 `DataSource`、`JdbcTemplate`），并通过 `@ConfigurationProperties` 绑定 `application.yml` 中的配置（如 `spring.datasource.url` 绑定到 `DataSource` 的 `url` 属性）。

- **@SpringBootApplication 包含的核心注解**：
    1. **@SpringBootConfiguration**：等价于 `@Configuration`，标记当前类为 Spring 配置类，允许定义 `@Bean` 方法。
    2. **@ComponentScan**：扫描当前包及其子包下的 `@Component` 注解类（包括 `@Controller`、`@Service`、`@Repository`），将其注册为 Bean。
    3. **@EnableAutoConfiguration**：开启自动配置，是自动配置的核心触发点（导入 `AutoConfigurationImportSelector`）。


### 2. Spring Boot 起步依赖（Starter）的原理是什么？如何自定义一个 Starter？
**答案**：
- **起步依赖原理**：  
  Starter 是 Spring Boot 简化依赖管理的“依赖描述符”，核心是“一站式引入功能所需的所有依赖，并配置自动配置类”，用户无需手动导入多个依赖或编写配置。  
  原理细节：
    1. **依赖聚合**：Starter 的 `pom.xml` 中包含功能所需的核心依赖（如 `spring-boot-starter-web` 包含 Spring MVC、Tomcat、Jackson 等）。
    2. **自动配置绑定**：Starter 中包含自动配置类（如 `WebMvcAutoConfiguration`），并在 `META-INF/spring.factories` 中注册，Spring Boot 启动时自动扫描并生效。
    3. **配置属性绑定**：通过 `@ConfigurationProperties` 注解，将 `application.yml` 中的配置（如 `spring.web` 前缀）绑定到自动配置类的属性中，实现“配置驱动”。

- **自定义 Starter 步骤（以 `my-log-starter` 为例）**：  
  目标：实现一个“日志 Starter”，自动配置日志工具类，支持通过配置文件指定日志级别。  
  步骤 1：创建 Maven 项目，命名为 `my-log-spring-boot-starter`（第三方 Starter 命名规范：`xxx-spring-boot-starter`）。  
  步骤 2：配置 `pom.xml`，引入自动配置核心依赖：
  ```xml
  <dependencies>
      <!-- Spring Boot 自动配置核心依赖 -->
      <dependency>
          <groupId>org.springframework.boot</groupId>
          <artifactId>spring-boot-autoconfigure</artifactId>
          <version>2.7.0</version>
      </dependency>
      <!-- 配置属性绑定依赖（可选，用于绑定 application.yml 配置） -->
      <dependency>
          <groupId>org.springframework.boot</groupId>
          <artifactId>spring-boot-configuration-processor</artifactId>
          <version>2.7.0</version>
          <optional>true</optional>
      </dependency>
      <!-- 日志依赖（如 SLF4J + Logback） -->
      <dependency>
          <groupId>org.slf4j</groupId>
          <artifactId>slf4j-api</artifactId>
          <version>1.7.36</version>
      </dependency>
  </dependencies>
  ```  
  步骤 3：编写配置属性类（绑定 `application.yml` 中的 `my.log` 前缀配置）：
  ```java
  @ConfigurationProperties(prefix = "my.log")
  public class MyLogProperties {
      // 默认日志级别为 INFO
      private String level = "INFO";
      // 是否打印线程名
      private boolean printThreadName = false;

      // getter/setter
  }
  ```  
  步骤 4：编写自动配置类（注册日志工具类 Bean，通过条件注解判断生效）：
  ```java
  @Configuration
  // 当类路径下存在 Slf4j 类时生效
  @ConditionalOnClass(org.slf4j.Logger.class)
  // 启用配置属性绑定（绑定 MyLogProperties）
  @EnableConfigurationProperties(MyLogProperties.class)
  public class MyLogAutoConfiguration {
      private final MyLogProperties properties;

      // 构造器注入配置属性
      public MyLogAutoConfiguration(MyLogProperties properties) {
          this.properties = properties;
      }

      // 注册日志工具类 Bean（用户可直接注入使用）
      @Bean
      // 当容器中不存在 MyLogUtil 时生效（允许用户自定义）
      @ConditionalOnMissingBean
      public MyLogUtil myLogUtil() {
          MyLogUtil logUtil = new MyLogUtil();
          // 从配置属性中设置日志级别
          logUtil.setLevel(properties.getLevel());
          logUtil.setPrintThreadName(properties.isPrintThreadName());
          return logUtil;
      }
  }
  ```  
  步骤 5：编写日志工具类（核心功能实现）：
  ```java
  public class MyLogUtil {
      private org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(MyLogUtil.class);
      private String level;
      private boolean printThreadName;

      // 日志打印方法
      public void info(String message) {
          if ("INFO".equalsIgnoreCase(level) || "DEBUG".equalsIgnoreCase(level)) {
              String logMsg = buildLogMsg(message);
              logger.info(logMsg);
          }
      }

      private String buildLogMsg(String message) {
          if (printThreadName) {
              return "[" + Thread.currentThread().getName() + "] " + message;
          }
          return message;
      }

      // getter/setter
  }
  ```  
  步骤 6：在 `META-INF/spring.factories` 中注册自动配置类：
  ```properties
  # 自动配置类清单（key 固定，value 为自动配置类全类名）
  org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
  com.xxx.autoconfigure.MyLogAutoConfiguration
  ```  
  步骤 7：打包发布（`mvn clean install`），用户引入依赖即可使用：
  ```xml
  <dependency>
      <groupId>com.xxx</groupId>
      <artifactId>my-log-spring-boot-starter</artifactId>
      <version>1.0.0</version>
  </dependency>
  ```  
  用户配置 `application.yml`：
  ```yaml
  my:
    log:
      level: DEBUG
      print-thread-name: true
  ```  
  用户注入使用：
  ```java
  @Service
  public class UserService {
      @Autowired
      private MyLogUtil logUtil;

      public void getUser() {
          logUtil.info("查询用户信息"); // 输出：[main] 查询用户信息
      }
  }
  ```


### 3. Spring Boot 外部化配置的优先级是怎样的？如何实现多环境配置？
**答案**：
- **外部化配置优先级（从高到低，后加载的覆盖先加载的）**：
    1. 命令行参数（如 `java -jar app.jar --spring.profiles.active=prod`）。
    2. 系统环境变量（如 `SPRING_PROFILES_ACTIVE=prod`）。
    3. 应用配置文件（按以下路径顺序，后加载覆盖前加载）：
        - `file:./config/`（项目根目录下的 `config` 文件夹，优先级最高）。
        - `file:./`（项目根目录）。
        - `classpath:/config/`（类路径下的 `config` 文件夹）。
        - `classpath:/`（类路径根目录，优先级最低）。
    4. Spring Boot 内置默认配置（如默认端口 8080）。

- **多环境配置实现**：  
  场景：区分开发（dev）、测试（test）、生产（prod）环境，不同环境使用不同配置（如数据库 URL、端口）。  
  步骤 1：创建多环境配置文件，命名规则为 `application-{profile}.yml`：
    - `application-dev.yml`（开发环境）：
      ```yaml
      server:
        port: 8080
      spring:
        datasource:
          url: jdbc:mysql://localhost:3306/dev_db
      ```  
    - `application-test.yml`（测试环境）：
      ```yaml
      server:
        port: 8081
      spring:
        datasource:
          url: jdbc:mysql://localhost:3306/test_db
      ```  
    - `application-prod.yml`（生产环境）：
      ```yaml
      server:
        port: 80
      spring:
        datasource:
          url: jdbc:mysql://prod-server:3306/prod_db
      ```  
  步骤 2：创建共享配置文件 `application.yml`，配置所有环境共享的属性（如数据库用户名、密码）：
  ```yaml
  # 共享配置
  spring:
    datasource:
      username: root
      password: 123456
    profiles:
      active: dev # 默认激活开发环境（可通过命令行/环境变量覆盖）
  ```  
  步骤 3：激活指定环境：
    - 方式 1：配置文件激活（如 `application.yml` 中 `spring.profiles.active=dev`）。
    - 方式 2：命令行激活（如 `java -jar app.jar --spring.profiles.active=prod`）。
    - 方式 3：系统环境变量激活（如 Linux 中 `export SPRING_PROFILES_ACTIVE=test`，再启动 Jar 包）。


### 4. Spring Boot Actuator 的核心功能是什么？如何自定义健康检查？
**答案**：
- **Actuator 核心功能**：  
  Actuator 是 Spring Boot 提供的“运维监控工具”，通过端点（Endpoint）暴露应用内部状态，核心功能包括：
    1. **健康检查（/actuator/health）**：展示应用健康状态（`UP`/`DOWN`/`OUT_OF_SERVICE`），默认检查磁盘空间、数据库连接等。
    2. **信息展示（/actuator/info）**：展示应用自定义信息（如版本、作者，需配置 `info.*` 属性）。
    3. **指标监控（/actuator/metrics）**：收集应用运行指标（如 JVM 内存、CPU 使用率、HTTP 请求数）。
    4. **日志管理（/actuator/loggers）**：查看/动态修改日志级别（如将 `com.xxx.service` 的日志级别改为 `DEBUG`）。
    5. **优雅关闭（/actuator/shutdown）**：发送 `POST` 请求关闭应用（需手动开启）。

- **Actuator 启用与配置**：
    1. 引入依赖：
  ```xml
  <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-actuator</artifactId>
  </dependency>
  ```  
    2. 配置端点（`application.yml`）：
  ```yaml
  management:
    endpoints:
      web:
        exposure:
          include: health,info,metrics,loggers # 暴露的 HTTP 端点（* 表示所有）
          base-path: /monitor # 自定义端点基础路径（默认 /actuator）
    endpoint:
      health:
        show-details: always # 显示健康详情（默认仅当授权后显示）
      shutdown:
        enabled: true # 启用 shutdown 端点（生产环境谨慎开启）
  ```  

- **自定义健康检查实现**：  
  场景：补充默认健康检查（如检查 Redis 连接、自定义服务状态）。  
  步骤：
    1. 实现 `HealthIndicator` 接口（Spring Boot 2.x 推荐）或 `ReactiveHealthIndicator`（响应式应用）：
       ```java
       // 自定义 Redis 健康检查
       @Component
       public class RedisHealthIndicator implements HealthIndicator {
           @Autowired
           private RedisTemplate<String, Object> redisTemplate;
  
           @Override
           public Health health() {
               try {
                   // 检查 Redis 连接（执行 ping 命令）
                   String ping = redisTemplate.getConnectionFactory().getConnection().ping();
                   if ("PONG".equals(ping)) {
                       // 健康状态为 UP，携带详情
                       return Health.up()
                               .withDetail("service", "Redis")
                               .withDetail("status", "connected")
                               .withDetail("ping", ping)
                               .build();
                   } else {
                       // 健康状态为 DOWN
                       return Health.down()
                               .withDetail("service", "Redis")
                               .withDetail("status", "disconnected")
                               .build();
                   }
               } catch (Exception e) {
                   // 捕获异常，健康状态为 DOWN，携带异常信息
                   return Health.down(e)
                           .withDetail("service", "Redis")
                           .withDetail("error", e.getMessage())
                           .build();
               }
           }
       }
       ```  
    2. 访问 `http://localhost:8080/monitor/health`，查看自定义健康检查结果：
       ```json
       {
         "status": "UP",
         "components": {
           "redis": {
             "status": "UP",
             "details": {
               "service": "Redis",
               "status": "connected",
               "ping": "PONG"
             }
           },
           "diskSpace": {
             "status": "UP",
             "details": { ... }
           }
         }
       }
       ```


### 5. Spring Boot 2.x 与 1.x 相比，有哪些核心差异？
**答案**：  
Spring Boot 2.x 是对 1.x 的重大升级，核心差异集中在“性能优化、功能扩展、依赖升级”：  
| 维度                | Spring Boot 1.x                          | Spring Boot 2.x                          |
|---------------------|------------------------------------------|------------------------------------------|
| 最低 JDK 版本       | JDK 6（1.5+ 支持 JDK 6，1.6+ 支持 JDK 7） | JDK 8（2.0+ 支持 JDK 8，2.7+ 支持 JDK 17） |
| 默认数据源          | Tomcat JDBC（性能一般）                  | HikariCP（性能更优，轻量级，默认集成）    |
| 自动配置类          | 基础自动配置（如 `WebMvcAutoConfiguration`） | 拆分/新增自动配置类（如 `WebMvcAutoConfiguration` 拆分出 `WebMvcProperties`，新增 `WebFluxAutoConfiguration` 支持响应式） |
| Actuator 端点       | 基础端点（/health、/info），配置简单      | 端点重构：支持动态开启/关闭、自定义路径；新增 `metrics` 端点（指标监控）、`loggers` 端点（日志管理） |
| Spring MVC 改进     | 基于 Servlet 3.1                          | 支持 Servlet 4.0；新增 `WebMvcConfigurer` 接口默认方法（无需继承适配器） |
| 响应式编程支持      | 不支持（需手动集成 Spring WebFlux）      | 内置 Spring WebFlux（基于 Reactor 框架），支持响应式 Web 开发（非阻塞 IO） |
| 外部化配置          | 支持基本配置源（文件、命令行）            | 新增配置源（如 Spring Cloud Config、Vault）；配置优先级调整（命令行参数优先级更高） |
| 嵌入式容器          | Tomcat 8（1.5+）、Jetty 9.2+              | Tomcat 9（2.0+）、Jetty 9.4+、Undertow 2.0+（性能更优，支持 HTTP/2） |
| 构建工具            | Maven、Gradle 2.x                        | 支持 Gradle 4.x+（推荐），Maven 3.5+      |
| 核心依赖版本        | Spring Framework 4.x                      | Spring Framework 5.x（支持函数式编程、Reactive 编程） |