# Java + Spring + Spring Boot + MyBatis 综合开发规范

## 前言

本规范整合阿里巴巴Java开发手册核心要求与Spring/Spring Boot/MyBatis框架最佳实践，旨在为AI Agent生成代码提供明确的正反例对照，确保生成代码具备高可读性、高健壮性和可维护性。

约束等级分为三级：**【强制】**（必须遵守）、**【推荐】**（尽量遵守）、**【参考】**（可选参考）。


## 一、Java 基础开发规范

### 1.1 命名规范

**【强制】所有命名均不能以下划线或美元符号开始，也不能以下划线或美元符号结束**。

**反例：**
```java
// ❌ 错误：使用下划线和美元符号
public class _UserService {
    private String $name;
    public void _processData_() { }
}
```

**正例：**
```java
// ✅ 正确：符合驼峰命名规范
public class UserService {
    private String name;
    public void processData() { }
}
```

**【强制】严禁使用拼音与英文混合的方式，更不允许直接使用中文。**

**反例：**
```java
// ❌ 错误：拼音英文混合、中文命名
public class DaZhePromotion { }           // 打折促销
public int getPingfenByName() { }         // 评分
public void 处理订单() { }                 // 中文方法名
```

**正例：**
```java
// ✅ 正确：使用英文或国际通用拼音
public class DiscountPromotion { }
public int getRatingByName() { }
public void processOrder() { }
```

**【强制】类名使用 UpperCamelCase 风格，领域模型相关命名如 DO / DTO / VO / DAO 等全部大写。**

**反例：**
```java
// ❌ 错误：大小写混乱
public class macroPolo { }
public class UserDo { }
public class XMLService { }
```

**正例：**
```java
// ✅ 正确
public class MarcoPolo { }
public class UserDO { }
public class XmlService { }
```

**【强制】方法名、参数名、成员变量、局部变量统一使用 lowerCamelCase 风格。**

**反例：**
```java
// ❌ 错误
public class UserService {
    private String UserName;          // 变量名首字母大写
    public void GetHttpMessage() { }  // 方法名首字母大写
}
```

**正例：**
```java
// ✅ 正确
public class UserService {
    private String userName;
    public String getHttpMessage() { }
}
```

**【强制】常量命名全部大写，单词间用下划线隔开。**

**反例：**
```java
// ❌ 错误：不够语义化
public static final int MAX_COUNT = 100;     // 缺少上下文
```

**正例：**
```java
// ✅ 正确：语义完整清晰
public static final int MAX_STOCK_COUNT = 100;
public static final String DEFAULT_USER_STATUS = "ACTIVE";
```

**【强制】抽象类命名使用 Abstract 或 Base 开头；异常类命名使用 Exception 结尾；测试类命名以它要测试的类名开始，以 Test 结尾。**

**反例：**
```java
// ❌ 错误
public class UserServiceAbstract { }    // Abstract 应在开头
public class BusinessError { }          // 异常类不以 Exception 结尾
public class UserTestService { }        // 测试类不以 Test 结尾
```

**正例：**
```java
// ✅ 正确
public abstract class AbstractUserService { }
public class BusinessException extends RuntimeException { }
public class UserServiceTest { }
```


### 1.2 集合处理规范

**【强制】判断集合是否为空时使用 `isEmpty()` 方法，而非 `size() == 0`。**

**反例：**
```java
// ❌ 错误：使用 size() 判空
if (list.size() == 0) {
    // do something
}
```

**正例：**
```java
// ✅ 正确：使用 isEmpty()
if (list.isEmpty()) {
    // do something
}
```

**【推荐】初始化集合时指定容量，避免频繁扩容。**

**反例：**
```java
// ❌ 错误：不指定容量
List<String> list = new ArrayList<>();  // 默认容量10，多次add会触发扩容
for (int i = 0; i < 10000; i++) {
    list.add(String.valueOf(i));
}
```

**正例：**
```java
// ✅ 正确：预估并指定容量
List<String> list = new ArrayList<>(10000);
for (int i = 0; i < 10000; i++) {
    list.add(String.valueOf(i));
}
```

**【强制】禁止在 foreach 循环中进行元素的 remove/add 操作，应使用 Iterator。**

**反例：**
```java
// ❌ 错误：foreach 中修改集合
List<String> list = new ArrayList<>();
list.add("a");
list.add("b");
list.add("c");
for (String item : list) {
    if ("b".equals(item)) {
        list.remove(item);  // 抛出 ConcurrentModificationException
    }
}
```

**正例：**
```java
// ✅ 正确：使用 Iterator
List<String> list = new ArrayList<>();
list.add("a");
list.add("b");
list.add("c");
Iterator<String> iterator = list.iterator();
while (iterator.hasNext()) {
    String item = iterator.next();
    if ("b".equals(item)) {
        iterator.remove();
    }
}
```


### 1.3 异常处理规范

**【强制】不要捕获 Throwable，也不要直接抛出 Throwable。**

**反例：**
```java
// ❌ 错误：捕获 Throwable
try {
    // business logic
} catch (Throwable t) {
    // 会捕获 Error，可能掩盖 JVM 严重错误
}
```

**正例：**
```java
// ✅ 正确：捕获具体异常
try {
    // business logic
} catch (BusinessException e) {
    // 处理业务异常
} catch (Exception e) {
    // 处理其他异常
}
```

**【强制】异常信息应包括现场信息，不要仅输出一句错误日志。**

**反例：**
```java
// ❌ 错误：日志信息不足
try {
    userService.updateUser(user);
} catch (Exception e) {
    log.error("更新失败");  // 缺少关键信息，无法定位问题
}
```

**正例：**
```java
// ✅ 正确：包含足够上下文信息
try {
    userService.updateUser(user);
} catch (Exception e) {
    log.error("更新用户失败, userId={}, userName={}", user.getId(), user.getName(), e);
}
```


## 二、Spring Framework 规范

### 2.1 依赖注入规范

**【强制】优先使用构造器注入，避免字段注入。**

**反例：**
```java
// ❌ 错误：字段注入
@Service
public class OrderService {
    @Autowired
    private PaymentService paymentService;
    @Autowired
    private UserService userService;
    
    public void processOrder(Order order) {
        paymentService.pay(order);  // paymentService 可能为 null（单元测试时）
    }
}
```

**正例：**
```java
// ✅ 正确：构造器注入
@Service
public class OrderService {
    private final PaymentService paymentService;
    private final UserService userService;
    
    public OrderService(PaymentService paymentService, UserService userService) {
        this.paymentService = paymentService;
        this.userService = userService;
    }
    
    public void processOrder(Order order) {
        paymentService.pay(order);  // 保证不为 null
    }
}
```

> **说明**：构造器注入确保依赖不可变（final），便于单元测试，且能避免循环依赖问题。

**【推荐】当有多个同类型 Bean 时，使用 `@Qualifier` 或 `@Primary` 明确指定。**

**反例：**
```java
// ❌ 错误：多个同类型 Bean 未指定
@Service
public class NotificationService {
    @Autowired
    private MessageSender messageSender;  // 有 SmsSender 和 EmailSender 两个实现，无法确定注入哪个
}
```

**正例：**
```java
// ✅ 正确：使用 @Qualifier 指定
@Service
public class NotificationService {
    private final MessageSender messageSender;
    
    public NotificationService(@Qualifier("smsSender") MessageSender messageSender) {
        this.messageSender = messageSender;
    }
}

// 或使用 @Primary 标记默认实现
@Component
@Primary
public class SmsSender implements MessageSender { }
```


### 2.2 Bean 配置规范

**【推荐】Bean 配置使用 Java Config 方式，避免 XML 配置。**

**反例：**
```java
// ❌ 错误：使用 @Component 注解时仍用 XML 配置
// applicationContext.xml
// <bean id="userService" class="com.example.service.UserService">
//     <property name="userRepository" ref="userRepository"/>
// </bean>
```

**正例：**
```java
// ✅ 正确：使用 Java Config
@Configuration
public class AppConfig {
    @Bean
    public UserService userService(UserRepository userRepository) {
        return new UserService(userRepository);
    }
}
```


### 2.3 事务管理规范

**【强制】`@Transactional` 注解应加在 Service 层方法上，不要加在 Controller 层。**

**反例：**
```java
// ❌ 错误：Controller 层使用 @Transactional
@RestController
public class OrderController {
    @Autowired
    private OrderService orderService;
    
    @PostMapping("/orders")
    @Transactional  // 错误位置
    public Result createOrder(@RequestBody OrderDTO orderDTO) {
        return orderService.createOrder(orderDTO);
    }
}
```

**正例：**
```java
// ✅ 正确：Service 层使用 @Transactional
@RestController
public class OrderController {
    private final OrderService orderService;
    
    @PostMapping("/orders")
    public Result createOrder(@RequestBody OrderDTO orderDTO) {
        return orderService.createOrder(orderDTO);
    }
}

@Service
public class OrderService {
    @Transactional(rollbackFor = Exception.class)
    public Result createOrder(OrderDTO orderDTO) {
        // 业务逻辑
    }
}
```

**【强制】`@Transactional` 注解必须指定 `rollbackFor`，明确回滚的异常类型。**

**反例：**
```java
// ❌ 错误：未指定 rollbackFor，默认只回滚 RuntimeException
@Transactional
public void updateUser(User user) {
    userRepository.update(user);
    // 如果这里抛出 checked exception，不会回滚
}
```

**正例：**
```java
// ✅ 正确：明确指定 rollbackFor
@Transactional(rollbackFor = Exception.class)
public void updateUser(User user) {
    userRepository.update(user);
    // 任何 Exception 都会回滚
}
```


## 三、Spring Boot 规范

### 3.1 项目结构规范

**【推荐】采用分层架构组织代码，保持各层职责分离。**

**反例：**
```
src/main/java/com/example/app/
├── Application.java
├── UserController.java          // 所有类混在一起
├── OrderController.java
├── UserService.java
├── UserRepository.java
├── UserDTO.java
```

**正例：**
```
src/main/java/com/example/app/
├── Application.java
├── config/                       // 配置类
│   ├── WebConfig.java
│   └── MyBatisConfig.java
├── controller/                   // REST 控制器
│   ├── UserController.java
│   └── OrderController.java
├── service/                      // 业务逻辑服务
│   ├── UserService.java
│   └── impl/
│       └── UserServiceImpl.java
├── repository/                   // 数据访问层
│   ├── UserRepository.java
│   └── OrderRepository.java
├── model/                        // 数据模型
│   ├── dto/
│   │   ├── UserDTO.java
│   │   └── OrderDTO.java
│   ├── entity/
│   │   ├── UserDO.java
│   │   └── OrderDO.java
│   └── vo/
│       ├── UserVO.java
│       └── OrderVO.java
├── exception/                    // 自定义异常
│   ├── BusinessException.java
│   └── GlobalExceptionHandler.java
└── util/                         // 工具类
    ├── DateUtils.java
    └── ValidationUtils.java
```


### 3.2 配置管理规范

**【推荐】使用 `@ConfigurationProperties` 替代 `@Value` 进行配置绑定。**

**反例：**
```java
// ❌ 错误：多个 @Value 分散且重复
@Service
public class FileService {
    @Value("${file.upload.path}")
    private String uploadPath;
    
    @Value("${file.max-size}")
    private long maxSize;
    
    @Value("${file.allowed-types}")
    private List<String> allowedTypes;
}
```

**正例：**
```java
// ✅ 正确：使用 @ConfigurationProperties
@ConfigurationProperties(prefix = "file")
@Component
@Data
public class FileProperties {
    private String uploadPath;
    private long maxSize;
    private List<String> allowedTypes;
}

@Service
public class FileService {
    private final FileProperties fileProperties;
    
    public FileService(FileProperties fileProperties) {
        this.fileProperties = fileProperties;
    }
}
```


### 3.3 Controller 层规范

**【强制】Controller 层保持精简，只做请求参数校验和响应封装，业务逻辑下沉到 Service 层。**

**反例：**
```java
// ❌ 错误：Controller 中包含业务逻辑
@RestController
@RequestMapping("/api/users")
public class UserController {
    @Autowired
    private UserRepository userRepository;
    
    @PostMapping
    public UserVO createUser(@RequestBody UserDTO userDTO) {
        // 业务逻辑写在 Controller 中
        UserDO userDO = new UserDO();
        userDO.setUsername(userDTO.getUsername());
        userDO.setEmail(userDTO.getEmail());
        // 复杂的业务校验也写在这里...
        if (userRepository.existsByUsername(userDTO.getUsername())) {
            throw new RuntimeException("用户名已存在");
        }
        userRepository.save(userDO);
        return convertToVO(userDO);
    }
}
```

**正例：**
```java
// ✅ 正确：Controller 只做调度
@RestController
@RequestMapping("/api/users")
@Validated
public class UserController {
    private final UserService userService;
    
    @PostMapping
    public Result<UserVO> createUser(@Valid @RequestBody UserCreateDTO userDTO) {
        UserVO userVO = userService.createUser(userDTO);
        return Result.success(userVO);
    }
}

@Service
@Slf4j
public class UserService {
    private final UserRepository userRepository;
    
    @Transactional(rollbackFor = Exception.class)
    public UserVO createUser(UserCreateDTO userDTO) {
        // 业务逻辑在 Service 层
        validateUsername(userDTO.getUsername());
        UserDO userDO = buildUserDO(userDTO);
        userRepository.save(userDO);
        return convertToVO(userDO);
    }
}
```

**【推荐】统一 API 响应结构，使用标准 Result 类封装返回结果。**

**反例：**
```java
// ❌ 错误：直接返回不同类型，响应格式不统一
@GetMapping("/{id}")
public User getUser(@PathVariable Long id) {
    return userService.getById(id);  // 成功时返回 User 对象
}

@ExceptionHandler(Exception.class)
public String handleException(Exception e) {
    return "error: " + e.getMessage();  // 失败时返回字符串
}
```

**正例：**
```java
// ✅ 正确：统一响应结构
@Data
@AllArgsConstructor
public class Result<T> {
    private Integer code;
    private String message;
    private T data;
    
    public static <T> Result<T> success(T data) {
        return new Result<>(200, "success", data);
    }
    
    public static <T> Result<T> error(Integer code, String message) {
        return new Result<>(code, message, null);
    }
}

@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @GetMapping("/{id}")
    public Result<UserVO> getUser(@PathVariable Long id) {
        UserVO userVO = userService.getById(id);
        return Result.success(userVO);
    }
}

@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(BusinessException.class)
    public Result<Void> handleBusinessException(BusinessException e) {
        return Result.error(e.getCode(), e.getMessage());
    }
}
```


## 四、MyBatis 规范

### 4.1 Mapper 接口与 XML 映射规范

**【强制】Mapper 接口名与 XML 文件名保持一致，namespace 必须写对应接口的全限定名。**

**反例：**
```java
// ❌ 错误：文件名不一致
// 接口：com.example.repository.UserRepository.java
// XML：  resources/mapper/UserMapper.xml

// XML 中的 namespace 错误
<mapper namespace="com.example.repository.UserMapper">  // 应该是 UserRepository
```

**正例：**
```java
// ✅ 正确：文件名和 namespace 一致
// 接口：com.example.repository.UserRepository.java
public interface UserRepository {
    UserDO selectById(Long id);
}

// XML：resources/mapper/UserRepository.xml
<mapper namespace="com.example.repository.UserRepository">
    <select id="selectById" resultType="com.example.model.entity.UserDO">
        SELECT id, username, email, created_at
        FROM users
        WHERE id = #{id}
    </select>
</mapper>
```

**【强制】Mapper XML 文件中的 SQL 语句 id 必须与接口方法名完全一致。**

**反例：**
```java
// ❌ 错误：方法名与 SQL id 不一致
public interface UserRepository {
    UserDO findUserById(Long id);      // 接口方法名
}

<!-- XML 中 id 不匹配 -->
<select id="selectById" resultType="UserDO">  // id 不一致
    SELECT * FROM users WHERE id = #{id}
</select>
```

**正例：**
```java
// ✅ 正确：方法名与 id 完全一致
public interface UserRepository {
    UserDO selectById(Long id);
}

<!-- XML 中 id 匹配 -->
<select id="selectById" resultType="com.example.model.entity.UserDO">
    SELECT * FROM users WHERE id = #{id}
</select>
```


### 4.2 参数传递规范

**【强制】SQL 参数绑定使用 `#{}`，禁止在条件值拼接中使用 `${}`，防止 SQL 注入。**

**反例：**
```java
// ❌ 错误：使用 ${} 拼接参数，存在 SQL 注入风险
<select id="selectUserByName" resultType="UserDO">
    SELECT * FROM users WHERE username = '${username}'
</select>

// 输入：admin' OR '1'='1' --
// 结果：SELECT * FROM users WHERE username = 'admin' OR '1'='1' --'
// 会返回所有用户数据！
```

**正例：**
```java
// ✅ 正确：使用 #{} 预编译，防止 SQL 注入
<select id="selectUserByName" resultType="UserDO">
    SELECT * FROM users WHERE username = #{username}
</select>
```

**【参考】`${}` 仅在动态表名、列名、排序字段等无法预编译的场景使用，且必须进行白名单校验。**

**正例：**
```java
// ✅ 正确：白名单校验后使用 ${}
private static final Set<String> ALLOWED_COLUMNS = Set.of("id", "username", "create_time");

public List<UserDO> selectByOrder(String orderBy) {
    if (orderBy == null || !ALLOWED_COLUMNS.contains(orderBy)) {
        throw new IllegalArgumentException("Invalid column: " + orderBy);
    }
    return mapper.selectByOrder(orderBy);
}

<select id="selectByOrder" resultType="UserDO">
    SELECT * FROM users ORDER BY ${orderBy}
</select>
```


### 4.3 模糊查询规范

**【强制】模糊查询应使用 `CONCAT('%', #{keyword}, '%')` 方式，禁止使用 `${}` 拼接。**

**反例：**
```java
// ❌ 错误：使用 ${} 拼接模糊查询，存在 SQL 注入风险
<select id="searchUser" resultType="UserDO">
    SELECT * FROM users WHERE username LIKE '%${keyword}%'
</select>
```

**正例：**
```java
// ✅ 正确：使用 CONCAT 函数
<select id="searchUser" resultType="UserDO">
    SELECT * FROM users WHERE username LIKE CONCAT('%', #{keyword}, '%')
</select>
```


### 4.4 IN 查询规范

**【强制】IN 查询应使用 `<foreach>` 标签，禁止使用 `${}` 拼接。**

**反例：**
```java
// ❌ 错误：使用 ${} 拼接 IN 查询
<select id="selectByIds" resultType="UserDO">
    SELECT * FROM users WHERE id IN (${ids})
</select>
```

**正例：**
```java
// ✅ 正确：使用 <foreach> 标签
<select id="selectByIds" resultType="UserDO">
    SELECT * FROM users 
    WHERE id IN 
    <foreach collection="ids" item="id" open="(" separator="," close=")">
        #{id}
    </foreach>
</select>
```


### 4.5 结果映射规范

**【强制】当数据库字段与 Java 属性不一致时，必须使用 `<resultMap>` 显式映射。**

**反例：**
```java
// ❌ 错误：字段名不一致时未映射
// 数据库字段：user_id, user_name, created_at
// Java 属性：userId, userName, createdAt

<select id="selectById" resultType="UserDO">
    SELECT user_id, user_name, created_at FROM users WHERE id = #{id}
</select>
// 结果：Java 属性 userId、userName、createdAt 均为 null
```

**正例：**
```java
// ✅ 正确：使用 resultMap 显式映射
<resultMap id="BaseResultMap" type="com.example.model.entity.UserDO">
    <id column="id" property="id"/>
    <result column="user_id" property="userId"/>
    <result column="user_name" property="userName"/>
    <result column="created_at" property="createdAt"/>
</resultMap>

<select id="selectById" resultMap="BaseResultMap">
    SELECT id, user_id, user_name, created_at 
    FROM users 
    WHERE id = #{id}
</select>
```

**【推荐】开启驼峰命名自动映射（`mapUnderscoreToCamelCase: true`），但仍建议显式定义复杂映射。**

**正例：**
```yaml
# application.yml
mybatis:
  configuration:
    map-underscore-to-camel-case: true
```


### 4.6 动态 SQL 规范

**【推荐】使用 `<where>` 标签替代 `WHERE 1=1`，使用 `<set>` 标签处理 UPDATE 语句。**

**反例：**
```java
// ❌ 错误：使用 WHERE 1=1
<select id="selectByCondition" resultType="UserDO">
    SELECT * FROM users WHERE 1=1
    <if test="username != null">
        AND username = #{username}
    </if>
    <if test="email != null">
        AND email = #{email}
    </if>
</select>
```

**正例：**
```java
// ✅ 正确：使用 <where> 标签
<select id="selectByCondition" resultType="UserDO">
    SELECT * FROM users
    <where>
        <if test="username != null and username != ''">
            AND username = #{username}
        </if>
        <if test="email != null and email != ''">
            AND email = #{email}
        </if>
    </where>
</select>

// ✅ 正确：使用 <set> 标签处理更新
<update id="updateUser" parameterType="UserDO">
    UPDATE users
    <set>
        <if test="username != null">username = #{username},</if>
        <if test="email != null">email = #{email},</if>
        <if test="status != null">status = #{status},</if>
    </set>
    WHERE id = #{id}
</update>
```


### 4.7 查询优化规范

**【推荐】避免使用 `SELECT *`，明确列出所需字段。**

**反例：**
```java
// ❌ 错误：SELECT *
<select id="selectUserList" resultType="UserDO">
    SELECT * FROM users  // 返回所有字段，包括不需要的大字段
</select>
```

**正例：**
```java
// ✅ 正确：只查询需要的字段
<select id="selectUserList" resultType="UserDO">
    SELECT id, username, email, status, created_at
    FROM users
    WHERE status = #{status}
</select>
```


## 五、完整正例示例（综合演示）

以下是一个完整的 Spring Boot + MyBatis 用户管理模块正例，综合应用了上述所有规范：

### 5.1 实体类（UserDO.java）

```java
package com.example.app.model.entity;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 用户实体类
 * @author example
 * @since 2026-01-01
 */
@Data
public class UserDO {
    private Long id;
    private String username;
    private String email;
    private String passwordHash;
    private Integer status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

### 5.2 数据传输对象（UserDTO.java）

```java
package com.example.app.model.dto;

import lombok.Data;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * 用户创建请求 DTO
 */
@Data
public class UserCreateDTO {
    @NotBlank(message = "用户名不能为空")
    @Size(min = 3, max = 20, message = "用户名长度应在 3-20 之间")
    private String username;
    
    @NotBlank(message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    private String email;
    
    @NotBlank(message = "密码不能为空")
    @Size(min = 6, max = 20, message = "密码长度应在 6-20 之间")
    private String password;
}
```

### 5.3 Mapper 接口（UserRepository.java）

```java
package com.example.app.repository;

import com.example.app.model.entity.UserDO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

/**
 * 用户数据访问接口
 */
@Mapper
public interface UserRepository {
    
    /**
     * 根据 ID 查询用户
     */
    UserDO selectById(@Param("id") Long id);
    
    /**
     * 根据用户名查询用户
     */
    UserDO selectByUsername(@Param("username") String username);
    
    /**
     * 条件查询用户列表
     */
    List<UserDO> selectByCondition(@Param("username") String username,
                                   @Param("email") String email,
                                   @Param("status") Integer status);
    
    /**
     * 插入用户
     */
    int insert(UserDO user);
    
    /**
     * 更新用户
     */
    int updateById(UserDO user);
    
    /**
     * 删除用户
     */
    int deleteById(@Param("id") Long id);
}
```

### 5.4 Mapper XML（UserRepository.xml）

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.example.app.repository.UserRepository">

    <resultMap id="BaseResultMap" type="com.example.app.model.entity.UserDO">
        <id column="id" property="id"/>
        <result column="username" property="username"/>
        <result column="email" property="email"/>
        <result column="password_hash" property="passwordHash"/>
        <result column="status" property="status"/>
        <result column="created_at" property="createdAt"/>
        <result column="updated_at" property="updatedAt"/>
    </resultMap>

    <sql id="Base_Column_List">
        id, username, email, password_hash, status, created_at, updated_at
    </sql>

    <select id="selectById" resultMap="BaseResultMap">
        SELECT <include refid="Base_Column_List"/>
        FROM users
        WHERE id = #{id}
    </select>

    <select id="selectByUsername" resultMap="BaseResultMap">
        SELECT <include refid="Base_Column_List"/>
        FROM users
        WHERE username = #{username}
    </select>

    <select id="selectByCondition" resultMap="BaseResultMap">
        SELECT <include refid="Base_Column_List"/>
        FROM users
        <where>
            <if test="username != null and username != ''">
                AND username LIKE CONCAT('%', #{username}, '%')
            </if>
            <if test="email != null and email != ''">
                AND email = #{email}
            </if>
            <if test="status != null">
                AND status = #{status}
            </if>
        </where>
        ORDER BY id DESC
    </select>

    <insert id="insert" parameterType="com.example.app.model.entity.UserDO"
            useGeneratedKeys="true" keyProperty="id">
        INSERT INTO users (username, email, password_hash, status, created_at, updated_at)
        VALUES (#{username}, #{email}, #{passwordHash}, #{status}, #{createdAt}, #{updatedAt})
    </insert>

    <update id="updateById" parameterType="com.example.app.model.entity.UserDO">
        UPDATE users
        <set>
            <if test="email != null">email = #{email},</if>
            <if test="passwordHash != null">password_hash = #{passwordHash},</if>
            <if test="status != null">status = #{status},</if>
            <if test="updatedAt != null">updated_at = #{updatedAt},</if>
        </set>
        WHERE id = #{id}
    </update>

    <delete id="deleteById">
        DELETE FROM users WHERE id = #{id}
    </delete>
</mapper>
```

### 5.5 Service 层（UserService.java）

```java
package com.example.app.service;

import com.example.app.model.dto.UserCreateDTO;
import com.example.app.model.entity.UserDO;
import com.example.app.model.vo.UserVO;
import com.example.app.exception.BusinessException;
import com.example.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

/**
 * 用户业务服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {
    
    private static final int USER_STATUS_ACTIVE = 1;
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    /**
     * 创建用户
     */
    @Transactional(rollbackFor = Exception.class)
    public UserVO createUser(UserCreateDTO userCreateDTO) {
        // 校验用户名是否已存在
        UserDO existingUser = userRepository.selectByUsername(userCreateDTO.getUsername());
        if (existingUser != null) {
            throw new BusinessException(4001, "用户名已存在");
        }
        
        // 构建用户实体
        UserDO userDO = new UserDO();
        userDO.setUsername(userCreateDTO.getUsername());
        userDO.setEmail(userCreateDTO.getEmail());
        userDO.setPasswordHash(passwordEncoder.encode(userCreateDTO.getPassword()));
        userDO.setStatus(USER_STATUS_ACTIVE);
        userDO.setCreatedAt(LocalDateTime.now());
        userDO.setUpdatedAt(LocalDateTime.now());
        
        // 保存用户
        int result = userRepository.insert(userDO);
        if (result != 1) {
            log.error("用户创建失败, username={}", userCreateDTO.getUsername());
            throw new BusinessException(5001, "用户创建失败");
        }
        
        log.info("用户创建成功, userId={}, username={}", userDO.getId(), userDO.getUsername());
        
        // 转换为 VO 返回
        return convertToVO(userDO);
    }
    
    /**
     * 根据 ID 查询用户
     */
    public UserVO getById(Long id) {
        UserDO userDO = userRepository.selectById(id);
        if (userDO == null) {
            throw new BusinessException(4004, "用户不存在");
        }
        return convertToVO(userDO);
    }
    
    private UserVO convertToVO(UserDO userDO) {
        UserVO userVO = new UserVO();
        userVO.setId(userDO.getId());
        userVO.setUsername(userDO.getUsername());
        userVO.setEmail(userDO.getEmail());
        userVO.setStatus(userDO.getStatus());
        userVO.setCreatedAt(userDO.getCreatedAt());
        return userVO;
    }
}
```

### 5.6 Controller 层（UserController.java）

```java
package com.example.app.controller;

import com.example.app.model.dto.UserCreateDTO;
import com.example.app.model.vo.Result;
import com.example.app.model.vo.UserVO;
import com.example.app.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/**
 * 用户管理控制器
 */
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Validated
public class UserController {
    
    private final UserService userService;
    
    /**
     * 创建用户
     */
    @PostMapping
    public Result<UserVO> createUser(@Valid @RequestBody UserCreateDTO userCreateDTO) {
        UserVO userVO = userService.createUser(userCreateDTO);
        return Result.success(userVO);
    }
    
    /**
     * 查询用户
     */
    @GetMapping("/{id}")
    public Result<UserVO> getUser(@PathVariable Long id) {
        UserVO userVO = userService.getById(id);
        return Result.success(userVO);
    }
}
```

### 5.7 统一响应结果类（Result.java）

```java
package com.example.app.model.vo;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * 统一 API 响应结果
 */
@Data
@AllArgsConstructor
public class Result<T> {
    private Integer code;
    private String message;
    private T data;
    
    public static <T> Result<T> success(T data) {
        return new Result<>(200, "success", data);
    }
    
    public static <T> Result<T> success(String message, T data) {
        return new Result<>(200, message, data);
    }
    
    public static <T> Result<T> error(Integer code, String message) {
        return new Result<>(code, message, null);
    }
}
```

### 5.8 全局异常处理器（GlobalExceptionHandler.java）

```java
package com.example.app.exception;

import com.example.app.model.vo.Result;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.validation.BindException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * 全局异常处理器
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(BusinessException.class)
    @ResponseStatus(HttpStatus.OK)
    public Result<Void> handleBusinessException(BusinessException e) {
        log.warn("业务异常: code={}, message={}", e.getCode(), e.getMessage());
        return Result.error(e.getCode(), e.getMessage());
    }
    
    @ExceptionHandler({MethodArgumentNotValidException.class, BindException.class})
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Result<Void> handleValidationException(Exception e) {
        String message = e instanceof MethodArgumentNotValidException
                ? ((MethodArgumentNotValidException) e).getBindingResult().getAllErrors().get(0).getDefaultMessage()
                : "参数校验失败";
        log.warn("参数校验异常: {}", message);
        return Result.error(4000, message);
    }
    
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public Result<Void> handleException(Exception e) {
        log.error("系统异常", e);
        return Result.error(5000, "系统繁忙，请稍后再试");
    }
}
```

### 5.9 配置文件（application.yml）

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/example_db?useSSL=false&serverTimezone=UTC
    username: root
    password: ${DB_PASSWORD:}
    driver-class-name: com.mysql.cj.jdbc.Driver

mybatis:
  mapper-locations: classpath:mapper/*.xml
  type-aliases-package: com.example.app.model.entity
  configuration:
    map-underscore-to-camel-case: true
    log-impl: org.apache.ibatis.logging.slf4j.Slf4jImpl

logging:
  level:
    com.example.app.repository: DEBUG
```


## 六、快速检查清单

在生成 Java 代码前，请对照以下清单逐项检查：

### Java 基础
- [ ] 类名是否使用 UpperCamelCase？
- [ ] 方法名、变量名是否使用 lowerCamelCase？
- [ ] 常量是否全部大写并用下划线分隔？
- [ ] 是否使用 `isEmpty()` 判断集合为空？
- [ ] 集合初始化时是否指定了容量？
- [ ] 异常日志是否包含足够上下文信息？

### Spring Framework
- [ ] 是否使用构造器注入而非字段注入？
- [ ] 多 Bean 时是否使用 `@Qualifier` 或 `@Primary`？
- [ ] `@Transactional` 是否在 Service 层且指定了 `rollbackFor`？

### Spring Boot
- [ ] 项目结构是否按 controller/service/repository/model 分层？
- [ ] Controller 是否保持精简，业务逻辑是否在 Service 层？
- [ ] API 响应是否使用统一 Result 类？
- [ ] 配置绑定是否优先使用 `@ConfigurationProperties`？

### MyBatis
- [ ] Mapper XML 的 namespace 是否与接口全限定名一致？
- [ ] SQL id 是否与接口方法名一致？
- [ ] 参数绑定是否使用 `#{}` 而非 `${}`？
- [ ] 模糊查询是否使用 `CONCAT('%', #{param}, '%')`？
- [ ] 字段不一致时是否使用 `<resultMap>` 显式映射？
- [ ] 是否避免使用 `SELECT *`？

---

本规范可根据团队实际情况进行调整，建议将本规范作为 AI Agent 生成 Java 代码时的约束性输入，以确保输出代码符合企业级开发标准。