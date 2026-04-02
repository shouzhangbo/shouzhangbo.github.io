# MyBatis 全面面试题及答案（细节版）


## 一、MyBatis 基础概念与核心组件
### 1. 什么是 MyBatis？它与 JDBC 相比有哪些优势？
**答案**：
- **MyBatis 定义**：MyBatis 是一款优秀的 **ORM（对象关系映射）框架**，它封装了 JDBC 的复杂操作，通过 XML 或注解定义 SQL 语句，将 Java 对象与 SQL 结果集自动映射，简化数据库访问代码。
- **与 JDBC 相比的优势**：
    1. **减少模板代码**：JDBC 需手动编写加载驱动、创建连接、处理 ResultSet 等重复代码，MyBatis 自动完成这些操作，开发者仅需关注 SQL 本身。
    2. **SQL 与代码分离**：MyBatis 允许将 SQL 写在 XML 中（或通过注解），避免硬编码到 Java 类中，便于 SQL 维护和优化（如 DBA 可直接修改 XML 中的 SQL）。
    3. **自动映射**：MyBatis 支持 Java 对象与 SQL 结果集的自动映射（通过 `resultType` 或 `resultMap`），无需手动遍历 ResultSet 赋值。
    4. **动态 SQL**：提供 `if`、`where`、`foreach` 等标签，灵活拼接 SQL（JDBC 需手动拼接字符串，易出错且难维护）。
    5. **缓存支持**：内置一级缓存（SqlSession 级别）和二级缓存（namespace 级别），减少数据库访问次数，提升性能。
    6. **参数处理**：自动处理参数类型转换（如 Java 日期与数据库日期的映射），支持多种参数传递方式（单个参数、POJO、Map、@Param 注解）。


### 2. MyBatis 的核心组件有哪些？各自的作用和生命周期是什么？
**答案**：  
MyBatis 核心组件包括 `SqlSessionFactoryBuilder`、`SqlSessionFactory`、`SqlSession`、`Mapper 接口`、`Executor`、`StatementHandler` 等，核心组件的作用与生命周期如下：

| 核心组件               | 作用                                                                 | 生命周期                                                                 |
|------------------------|----------------------------------------------------------------------|--------------------------------------------------------------------------|
| SqlSessionFactoryBuilder | 读取 MyBatis 配置文件（mybatis-config.xml），构建 `SqlSessionFactory` 对象 | 短暂（方法级）：创建完 `SqlSessionFactory` 后立即销毁，无需长期持有       |
| SqlSessionFactory      | MyBatis 的“工厂类”，用于创建 `SqlSession` 对象                         | 长期（应用级）：应用启动时创建，全局唯一，随应用关闭而销毁                 |
| SqlSession             | 代表与数据库的一次会话，提供 CRUD 方法（如 `selectOne`、`insert`）      | 短暂（请求级/方法级）：每次数据库操作创建一个 `SqlSession`，使用后关闭（避免资源泄漏） |
| Mapper 接口            | 定义数据访问方法（如 `User selectById(Long id)`），与 XML/注解中的 SQL 绑定 | 长期（应用级）：随 `SqlSessionFactory` 创建，无状态，可复用               |
| Executor               | MyBatis 的执行器，负责执行 SQL 语句（如查询、更新），管理一级缓存         | 与 `SqlSession` 绑定（会话级）：`SqlSession` 创建时创建，`SqlSession` 关闭时销毁 |
| StatementHandler       | 封装 JDBC 的 `Statement`/`PreparedStatement`，处理 SQL 参数设置、结果集映射 | 与 `Executor` 绑定（SQL 执行级）：执行 SQL 时创建，执行完成后销毁         |


## 二、MyBatis 配置（核心配置文件 + Mapper 配置）
### 1. MyBatis 核心配置文件（mybatis-config.xml）包含哪些关键配置项？各配置项的作用是什么？
**答案**：  
`mybatis-config.xml` 是 MyBatis 的全局配置文件，核心配置项按顺序（MyBatis 要求配置顺序）如下：

1. **properties（属性配置）**
    - 作用：加载外部属性文件（如数据库连接信息），避免硬编码。
    - 配置示例：
      ```xml
      <!-- 加载 db.properties 文件 -->
      <properties resource="db.properties">
          <!-- 默认属性（外部文件未定义时生效） -->
          <property name="driver" value="com.mysql.cj.jdbc.Driver"/>
      </properties>
      ```  
    - 使用：在后续配置中通过 `${key}` 引用，如 `${jdbc.url}`。

2. **settings（全局设置）**
    - 作用：配置 MyBatis 全局行为（如缓存、日志、驼峰命名映射等）。
    - 常用配置：
      ```xml
      <settings>
          <!-- 开启驼峰命名自动映射（数据库字段 user_name → Java 属性 userName） -->
          <setting name="mapUnderscoreToCamelCase" value="true"/>
          <!-- 开启二级缓存 -->
          <setting name="cacheEnabled" value="true"/>
          <!-- 配置日志实现（如 SLF4J、LOG4J） -->
          <setting name="logImpl" value="org.apache.ibatis.logging.slf4j.Slf4jImpl"/>
          <!-- 懒加载开关（关联查询时生效） -->
          <setting name="lazyLoadingEnabled" value="true"/>
      </settings>
      ```

3. **typeAliases（类型别名）**
    - 作用：为 Java 类型定义简短别名，简化 Mapper 配置中 `resultType`/`parameterType` 的书写。
    - 配置示例：
      ```xml
      <typeAliases>
          <!-- 单个类别名（别名默认首字母小写，如 User → user） -->
          <typeAlias type="com.xxx.pojo.User" alias="user"/>
          <!-- 包扫描（所有类的别名为首字母小写的类名） -->
          <package name="com.xxx.pojo"/>
      </typeAliases>
      ```  
    - 注意：MyBatis 内置常用类型别名（如 `int` → `_int`、`Integer` → `integer`、`List` → `list`）。

4. **typeHandlers（类型处理器）**
    - 作用：处理 Java 类型与数据库类型的映射（如 Java 枚举 → 数据库 VARCHAR）。
    - 配置示例（自定义枚举类型处理器）：
      ```xml
      <typeHandlers>
          <typeHandler handler="com.xxx.handler.GenderTypeHandler" 
                      javaType="com.xxx.enums.GenderEnum" 
                      jdbcType="VARCHAR"/>
      </typeHandlers>
      ```  
    - 内置类型处理器：MyBatis 已实现大部分常用类型映射（如 `String` ↔ `VARCHAR`、`LocalDateTime` ↔ `DATETIME`），自定义仅需处理特殊类型。

5. **plugins（插件）**
    - 作用：拦截 MyBatis 核心组件（如 `Executor`、`StatementHandler`），实现自定义功能（如分页、SQL 日志打印、数据权限）。
    - 配置示例（分页插件 PageHelper）：
      ```xml
      <plugins>
          <plugin interceptor="com.github.pagehelper.PageInterceptor">
              <!-- 配置数据库方言（如 MySQL、Oracle） -->
              <property name="helperDialect" value="mysql"/>
          </plugin>
      </plugins>
      ```

6. **environments（环境配置）**
    - 作用：配置数据库连接环境（支持多环境，如开发、测试、生产），指定事务管理器和数据源。
    - 配置示例：
      ```xml
      <environments default="dev"> <!-- 默认使用 dev 环境 -->
          <environment id="dev">
              <!-- 事务管理器：MyBatis 内置 JDBC 事务（依赖数据源的连接） -->
              <transactionManager type="JDBC"/>
              <!-- 数据源：POOLED（连接池，推荐）、UNPOOLED（无连接池）、JNDI（容器数据源） -->
              <dataSource type="POOLED">
                  <property name="driver" value="${jdbc.driver}"/>
                  <property name="url" value="${jdbc.url}"/>
                  <property name="username" value="${jdbc.username}"/>
                  <property name="password" value="${jdbc.password}"/>
              </dataSource>
          </environment>
          <environment id="prod"> <!-- 生产环境 -->
              <transactionManager type="JDBC"/>
              <dataSource type="POOLED">...</dataSource>
          </environment>
      </environments>
      ```

7. **mappers（Mapper 注册）**
    - 作用：注册 Mapper 接口或 XML 配置文件，让 MyBatis 加载映射关系。
    - 常用注册方式：
      ```xml
      <mappers>
          <!-- 1. 注册单个 Mapper XML 文件 -->
          <mapper resource="mapper/UserMapper.xml"/>
          <!-- 2. 注册单个 Mapper 接口（需与 XML 同包同名，或用注解映射） -->
          <mapper class="com.xxx.mapper.UserMapper"/>
          <!-- 3. 包扫描（注册指定包下所有 Mapper 接口，需 XML 同包同名） -->
          <package name="com.xxx.mapper"/>
      </mappers>
      ```  
    - 注意：若 Mapper 接口用 **注解映射 SQL**（如 `@Select`），无需 XML 文件，直接通过 `class` 或 `package` 注册即可。


### 2. Mapper 接口与 XML 配置的映射规则是什么？如何避免“绑定异常”（BindingException）？
**答案**：
#### （1）Mapper 接口与 XML 配置的核心映射规则
MyBatis 通过“接口全类名”与“XML 命名空间（namespace）”绑定，接口方法与 XML 中 `select`/`insert` 等标签的 `id` 绑定，具体规则：
1. **namespace 必须与 Mapper 接口全类名一致**：  
   例：接口 `com.xxx.mapper.UserMapper` → XML 中 `namespace="com.xxx.mapper.UserMapper"`。
2. **XML 标签的 id 必须与 Mapper 接口方法名一致**：  
   例：接口方法 `User selectById(Long id)` → XML 中 `<select id="selectById" ...>`。
3. **参数类型（parameterType）与接口方法参数类型匹配**：  
   若方法参数为 `User`，则 XML 中 `parameterType="user"`（或省略，MyBatis 自动推断）。
4. **返回类型（resultType/resultMap）与接口方法返回类型匹配**：  
   例：方法返回 `User` → XML 中 `resultType="user"` 或 `resultMap="BaseResultMap"`。
5. **XML 文件与 Mapper 接口需“同包同名”（若用包扫描注册）**：  
   例：接口 `com.xxx.mapper.UserMapper` → XML 文件路径 `resources/mapper/com/xxx/mapper/UserMapper.xml`（或通过 `resource` 显式指定路径，无需同包）。

#### （2）避免 BindingException 的常见方案
`BindingException` 通常是“映射规则不满足”导致（如 id 不匹配、namespace 错误），解决方案：
1. 检查 XML 的 `namespace` 是否与 Mapper 接口全类名完全一致（注意包名大小写、拼写）。
2. 检查 XML 标签 `id` 是否与接口方法名完全一致（如方法名 `selectUser` vs XML id `selectUsers`）。
3. 检查 Mapper 注册方式：若用 `package` 注册，确保 XML 与接口“同包同名”（或通过 `resource` 显式指定 XML 路径）。
4. 检查方法参数：若接口方法有多个参数且未用 `@Param` 注解，XML 中需用 `param1`/`param2` 引用（或改用 `@Param` 定义参数名）。
5. 检查依赖与编译：确保 Mapper XML 文件被正确打包到 `classes/mapper` 目录（Maven 项目需在 `pom.xml` 中配置资源过滤，避免 XML 被忽略）：
   ```xml
   <!-- Maven 资源过滤配置（pom.xml） -->
   <build>
       <resources>
           <resource>
               <directory>src/main/resources</directory>
               <includes>
                   <include>**/*.xml</include>
                   <include>**/*.properties</include>
               </includes>
           </resource>
           <resource>
               <directory>src/main/java</directory>
               <includes>
                   <include>**/*.xml</include> <!-- 若 XML 在 java 目录下 -->
               </includes>
           </resource>
       </resources>
   </build>
   ```


## 三、MyBatis 映射（参数传递 + 结果映射 + 关联查询）
### 1. MyBatis 支持哪些参数传递方式？如何处理多参数传递？
**答案**：  
MyBatis 支持多种参数传递方式，核心场景及处理方式如下：

#### （1）常见参数传递方式
| 参数类型               | 传递方式                                                                 | XML 中引用方式                          |
|------------------------|--------------------------------------------------------------------------|---------------------------------------|
| 单个基本类型（int/long/String） | 直接传递（如 `User selectById(Long id)`）                                | `#{id}`（参数名可任意，MyBatis 自动匹配） |
| 单个 POJO 对象（如 User）       | 传递 POJO（如 `int insertUser(User user)`）                               | `#{username}`、`#{age}`（引用 POJO 的属性名） |
| 单个 Map 对象                 | 传递 Map（如 `List<User> selectByMap(Map<String, Object> map)`）          | `#{username}`（引用 Map 的 key）        |
| 多个基本类型参数              | 方式1：用 `@Param` 注解（推荐）；方式2：默认 `param1/param2`；方式3：封装为 POJO/Map | 方式1：`#{name}`（`@Param("name") String name`）；方式2：`#{param1}` |
| 集合参数（List/Array）        | 传递 List/Array（如 `List<User> selectByIds(List<Long> ids)`）            | 用 `foreach` 标签遍历：`#{item}`（List）、`#{array}`（Array） |

#### （2）多参数传递的核心处理方案（高频考点）
多参数传递（如 `List<User> selectByUsernameAndAge(String username, Integer age)`）有 3 种常用方案：

1. **方案1：@Param 注解（推荐，简单直观）**
    - 接口方法：用 `@Param` 定义参数名，明确 XML 中的引用标识。
      ```java
      // 接口方法
      List<User> selectByUsernameAndAge(
          @Param("username") String username, 
          @Param("age") Integer age
      );
      ```  
    - XML 引用：直接用 `@Param` 定义的名称引用。
      ```xml
      <select id="selectByUsernameAndAge" resultType="user">
          SELECT * FROM user 
          WHERE username = #{username} AND age = #{age}
      </select>
      ```

2. **方案2：默认 param1/param2（不推荐，可读性差）**
    - 接口方法：不使用 `@Param`，MyBatis 自动将参数按顺序命名为 `param1`、`param2`...
      ```java
      // 接口方法（无 @Param）
      List<User> selectByUsernameAndAge(String username, Integer age);
      ```  
    - XML 引用：用 `param1` 引用第一个参数，`param2` 引用第二个参数。
      ```xml
      <select id="selectByUsernameAndAge" resultType="user">
          SELECT * FROM user 
          WHERE username = #{param1} AND age = #{param2}
      </select>
      ```

3. **方案3：封装为 POJO 或 Map（适合参数较多场景）**
    - 若参数超过 3 个，推荐封装为 POJO（如 `UserQuery`）或 Map，避免 `@Param` 过多导致代码冗余。
      ```java
      // 1. 封装为 POJO
      class UserQuery {
          private String username;
          private Integer age;
          // getter/setter
      }
      // 接口方法
      List<User> selectByQuery(UserQuery query);
 
      // 2. 封装为 Map
      // 接口方法
      List<User> selectByMap(Map<String, Object> map);
      // 调用时
      Map<String, Object> map = new HashMap<>();
      map.put("username", "张三");
      map.put("age", 20);
      userMapper.selectByMap(map);
      ```  
    - XML 引用：POJO 用属性名，Map 用 key。
      ```xml
      <!-- POJO 引用 -->
      <select id="selectByQuery" resultType="user" parameterType="userQuery">
          SELECT * FROM user 
          WHERE username = #{username} AND age = #{age}
      </select>
 
      <!-- Map 引用 -->
      <select id="selectByMap" resultType="user">
          SELECT * FROM user 
          WHERE username = #{username} AND age = #{age}
      </select>
      ```

#### （3）集合参数处理（foreach 标签）
传递 List/Array 集合时，需用 `foreach` 标签遍历（如批量查询、批量删除）：
- 示例1：List 参数（批量查询）
  ```java
  // 接口方法
  List<User> selectByIds(@Param("ids") List<Long> ids);
  ```  
  ```xml
  <select id="selectByIds" resultType="user">
      SELECT * FROM user 
      WHERE id IN 
      <foreach collection="ids" item="id" open="(" separator="," close=")">
          #{id} <!-- item 是集合中单个元素的别名 -->
      </foreach>
  </select>
  ```  

- 示例2：Array 参数（批量删除）
  ```java
  // 接口方法
  int deleteByIds(Long[] ids);
  ```  
  ```xml
  <delete id="deleteByIds">
      DELETE FROM user 
      WHERE id IN 
      <foreach collection="array" item="id" open="(" separator="," close=")">
          #{id} <!-- Array 类型的 collection 固定为 "array" -->
      </foreach>
  </delete>
  ```  

- `foreach` 标签属性说明：
    - `collection`：集合参数名（List 用 `@Param` 定义的名称，Array 固定为 `array`）。
    - `item`：集合中单个元素的别名（如 `id`）。
    - `open`：遍历结果的前缀（如 `(`）。
    - `separator`：元素间的分隔符（如 `,`）。
    - `close`：遍历结果的后缀（如 `)`）。


### 2. MyBatis 中 #{} 和 ${} 的区别是什么？为什么推荐用 #{}？
**答案**：  
`#{}` 和 `${}` 是 MyBatis 中引用参数的两种方式，核心区别在于 **SQL 预编译处理** 和 **SQL 注入风险**：

| 对比维度               | #{}                                                                 | ${}                                                                 |
|------------------------|----------------------------------------------------------------------|----------------------------------------------------------------------|
| 处理方式               | 占位符（PreparedStatement）：将参数视为“值”，自动添加引号，预编译 SQL | 字符串拼接（Statement）：将参数直接拼接到 SQL 中，不预编译           |
| SQL 注入风险           | 无风险（参数被当作值处理，如输入 `' OR '1'='1` 会被视为字符串）       | 有风险（参数直接拼接，如输入 `' OR '1'='1` 会篡改 SQL 逻辑）         |
| 适用场景               | 绝大多数场景（参数作为“值”传递，如 WHERE 条件、INSERT 赋值）           | 特殊场景（参数作为“SQL 片段”，如表名、字段名、ORDER BY 排序字段）     |
| 示例（参数 id=1）      | SQL 最终为 `SELECT * FROM user WHERE id = ?`，参数 1 预编译传入       | SQL 最终为 `SELECT * FROM user WHERE id = 1`，参数 1 直接拼接       |

#### （1）推荐用 #{} 的原因
1. **防止 SQL 注入**：这是核心原因。`#{}` 通过预编译（PreparedStatement）将参数与 SQL 分离，即使参数包含恶意 SQL 片段（如 `' OR '1'='1`），也会被当作普通字符串处理，避免篡改 SQL 逻辑。
2. **自动类型转换**：`#{}` 会根据参数类型自动添加引号（如字符串参数添加 `''`，数值参数不添加），无需手动处理类型差异。
3. **提升性能**：PreparedStatement 支持 SQL 预编译，同一 SQL 语句多次执行时，数据库无需重复编译，提升执行效率。

#### （2）${} 的适用场景（需谨慎使用）
`${}` 仅在“参数作为 SQL 片段”时使用，且需确保参数来源安全（如内部配置，非用户输入），常见场景：
1. **动态表名**（如分表查询：`user_2024`、`user_2025`）：
   ```xml
   <select id="selectByTableName" resultType="user">
       SELECT * FROM ${tableName} WHERE id = #{id}
   </select>
   ```  
   注意：`tableName` 必须由后端控制（如根据日期生成），禁止用户输入，避免注入。

2. **动态排序字段**（如按 `username` 或 `age` 排序）：
   ```xml
   <select id="selectOrderBy" resultType="user">
       SELECT * FROM user 
       ORDER BY ${sortField} ${sortOrder}
   </select>
   ```  
   注意：`sortField` 和 `sortOrder`（ASC/DESC）需后端校验（如仅允许指定字段排序），避免用户输入 `username; DROP TABLE user;` 等恶意片段。


### 3. 什么是 resultMap？它与 resultType 的区别是什么？如何用 resultMap 处理关联查询（一对一、一对多）？
**答案**：
#### （1）resultMap 定义
`resultMap` 是 MyBatis 中 **自定义结果映射规则** 的标签，用于解决“数据库字段名与 Java 实体类属性名不匹配”或“复杂关联查询（一对一、一对多）”的场景，支持自定义映射关系、级联查询等。

#### （2）resultMap 与 resultType 的区别
| 对比维度               | resultMap                                                                 | resultType                                                                 |
|------------------------|--------------------------------------------------------------------------|--------------------------------------------------------------------------|
| 核心作用               | 自定义映射规则（字段名→属性名、关联查询）                                | 直接指定返回类型（依赖字段名与属性名匹配，或开启驼峰映射）                |
| 适用场景               | 1. 字段名与属性名不匹配（且未开启驼峰映射）；2. 关联查询（一对一、一对多）；3. 级联查询 | 1. 字段名与属性名完全一致（或开启驼峰映射）；2. 简单查询（无关联）；3. 返回值为基本类型/Map |
| 灵活性                 | 高（支持自定义映射、延迟加载、关联查询）                                  | 低（仅支持默认映射，无复杂配置）                                          |
| 配置复杂度             | 较复杂（需定义映射规则）                                                | 简单（直接指定类型）                                                      |

#### （3）resultMap 处理关联查询（一对一、一对多）
关联查询是 `resultMap` 的核心场景，MyBatis 提供 `association`（一对一）和 `collection`（一对多）标签实现级联映射。

##### ① 一对一关联（如 User ↔ UserCard，一个用户对应一张身份证）
- 实体类：
  ```java
  // 用户类
  class User {
      private Long id;
      private String username;
      private UserCard userCard; // 一对一关联：用户→身份证
      // getter/setter
  }
  // 身份证类
  class UserCard {
      private Long id;
      private String cardNo;
      private Long userId; // 关联用户ID
      // getter/setter
  }
  ```  

- Mapper XML 配置（两种方式：嵌套结果、嵌套查询）：  
  **方式1：嵌套结果（单 SQL 关联查询，推荐，减少数据库访问）**
  ```xml
  <!-- 定义 resultMap：User 关联 UserCard -->
  <resultMap id="UserWithCardResultMap" type="user">
      <!-- 主键映射 -->
      <id column="id" property="id"/>
      <!-- 基本字段映射 -->
      <result column="username" property="username"/>
      <!-- 一对一关联：association 标签 -->
      <association property="userCard" javaType="userCard"> <!-- javaType：关联对象类型 -->
          <id column="card_id" property="id"/> <!-- column：数据库关联字段（需别名区分） -->
          <result column="card_no" property="cardNo"/>
          <result column="user_id" property="userId"/>
      </association>
  </resultMap>

  <!-- 单 SQL 关联查询（user 表 join user_card 表） -->
  <select id="selectUserWithCard" resultMap="UserWithCardResultMap">
      SELECT 
          u.id, u.username, 
          uc.id AS card_id, uc.card_no, uc.user_id
      FROM user u
      LEFT JOIN user_card uc ON u.id = uc.user_id
      WHERE u.id = #{id}
  </select>
  ```  

  **方式2：嵌套查询（多 SQL 分步查询，支持延迟加载）**
  ```xml
  <!-- 1. User 的 resultMap：关联 UserCard 的查询 -->
  <resultMap id="UserWithCardLazyResultMap" type="user">
      <id column="id" property="id"/>
      <result column="username" property="username"/>
      <!-- 一对一关联：select 指定查询 UserCard 的方法，column 传递关联字段（user.id） -->
      <association 
          property="userCard" 
          javaType="userCard"
          select="com.xxx.mapper.UserCardMapper.selectByUserId" <!-- 另一个 Mapper 的方法 -->
          column="id" <!-- 传递给 select 方法的参数（user.id → userCard.userId） -->
          fetchType="lazy"/> <!-- 开启延迟加载（全局 lazyLoadingEnabled=true 时可省略） -->
  </resultMap>

  <!-- 2. 查询 User 的 SQL -->
  <select id="selectUserWithCardLazy" resultMap="UserWithCardLazyResultMap">
      SELECT id, username FROM user WHERE id = #{id}
  </select>

  <!-- 3. UserCardMapper 的查询方法（分步查询时执行） -->
  <select id="selectByUserId" resultType="userCard">
      SELECT id, card_no AS cardNo, user_id AS userId 
      FROM user_card 
      WHERE user_id = #{userId}
  </select>
  ```  

##### ② 一对多关联（如 User ↔ Order，一个用户对应多个订单）
- 实体类：
  ```java
  class User {
      private Long id;
      private String username;
      private List<Order> orderList; // 一对多关联：用户→订单列表
      // getter/setter
  }
  class Order {
      private Long id;
      private String orderNo;
      private Long userId; // 关联用户ID
      // getter/setter
  }
  ```  

- Mapper XML 配置（嵌套结果方式）：
  ```xml
  <!-- 定义 resultMap：User 关联 Order 列表 -->
  <resultMap id="UserWithOrdersResultMap" type="user">
      <id column="id" property="id"/>
      <result column="username" property="username"/>
      <!-- 一对多关联：collection 标签 -->
      <collection 
          property="orderList" 
          ofType="order" <!-- ofType：集合中元素的类型（区别于 javaType） -->
          columnPrefix="order_"> <!-- 字段前缀（简化多表字段名冲突） -->
          <id column="id" property="id"/> <!-- 实际数据库字段为 order_id → 前缀+column → order_id -->
          <result column="no" property="orderNo"/> <!-- 数据库字段 order_no → order_no -->
          <result column="user_id" property="userId"/> <!-- 数据库字段 order_user_id → order_user_id -->
      </collection>
  </resultMap>

  <!-- 单 SQL 关联查询（user 表 join order 表） -->
  <select id="selectUserWithOrders" resultMap="UserWithOrdersResultMap">
      SELECT 
          u.id, u.username, 
          o.id AS order_id, o.order_no AS order_no, o.user_id AS order_user_id
      FROM user u
      LEFT JOIN `order` o ON u.id = o.user_id
      WHERE u.id = #{id}
  </select>
  ```  

- 关键说明：
    - `association` 用于“一对一”，`javaType` 指定关联对象类型；
    - `collection` 用于“一对多”，`ofType` 指定集合中元素类型（不可用 `javaType`）；
    - `fetchType="lazy"` 开启延迟加载（仅嵌套查询支持），全局需配置 `lazyLoadingEnabled=true`；
    - `columnPrefix` 用于多表字段名冲突（如两个表都有 `id`，用前缀区分）。


## 四、MyBatis 动态 SQL
### 1. MyBatis 动态 SQL 有哪些常用标签？各标签的作用和使用场景是什么？
**答案**：  
MyBatis 动态 SQL 是解决“SQL 拼接复杂”的核心功能，通过标签动态生成 SQL 片段，常用标签及场景如下：

#### （1）if 标签（条件判断）
- **作用**：根据参数值判断是否拼接 SQL 片段（满足条件则拼接，不满足则忽略）。
- **使用场景**：动态添加 WHERE 条件、INSERT 字段、UPDATE 赋值等。
- **示例（动态 WHERE 条件）**：
  ```xml
  <select id="selectUserByCondition" resultType="user">
      SELECT * FROM user
      WHERE 1=1 <!-- 避免后续 if 都不满足时 WHERE 后无条件 -->
      <!-- 若 username 不为 null 且不为空，拼接 username 条件 -->
      <if test="username != null and username != ''">
          AND username LIKE CONCAT('%', #{username}, '%')
      </if>
      <!-- 若 age 不为 null，拼接 age 条件 -->
      <if test="age != null">
          AND age = #{age}
      </if>
      <!-- 若 birthday 不为 null，拼接 birthday 条件 -->
      <if test="birthday != null">
          AND birthday &lt;= #{birthday} <!-- &lt; 是 < 的转义符，避免 XML 语法错误 -->
      </if>
  </select>
  ```  
- **注意**：`test` 属性中的表达式用 OGNL 语法（如 `username != null`，而非 `null != username`），字符串判断需加 `!= ''`（避免空字符串）。

#### （2）where 标签（优化 WHERE 条件）
- **作用**：自动处理 WHERE 关键字和多余的 `AND`/`OR`（若内部 if 标签拼接的 SQL 以 `AND`/`OR` 开头，会自动剔除）。
- **使用场景**：替代手动写 `WHERE 1=1`，优化动态 WHERE 条件。
- **示例（替代 if 标签中的 WHERE 1=1）**：
  ```xml
  <select id="selectUserByCondition" resultType="user">
      SELECT * FROM user
      <where> <!-- 自动添加 WHERE，剔除多余 AND/OR -->
          <if test="username != null and username != ''">
              AND username LIKE CONCAT('%', #{username}, '%') <!-- 开头的 AND 会被剔除 -->
          </if>
          <if test="age != null">
              AND age = #{age}
          </if>
      </where>
  </select>
  ```  
- **效果**：若两个 if 都满足，SQL 为 `SELECT * FROM user WHERE username LIKE ... AND age = ...`；若仅 age 满足，SQL 为 `SELECT * FROM user WHERE age = ...`（无多余 AND）。

#### （3）choose（when/otherwise）标签（分支选择）
- **作用**：类似 Java 的 `switch-case`，仅执行第一个满足条件的 `when` 标签，若所有 `when` 都不满足，执行 `otherwise`（可选）。
- **使用场景**：多条件互斥时（如“按 username 查询，若 username 为空则按 age 查询，否则查询所有”）。
- **示例**：
  ```xml
  <select id="selectUserByChoose" resultType="user">
      SELECT * FROM user
      <where>
          <choose>
              <!-- 第一个满足条件的 when 执行 -->
              <when test="username != null and username != ''">
                  username LIKE CONCAT('%', #{username}, '%')
              </when>
              <when test="age != null">
                  age = #{age}
              </when>
              <!-- 所有 when 不满足时执行 -->
              <otherwise>
                  1=1 <!-- 查询所有 -->
              </otherwise>
          </choose>
      </where>
  </select>
  ```

#### （4）foreach 标签（遍历集合）
- **作用**：遍历 List/Array/Map 集合，拼接 SQL 片段（如 `IN` 条件、批量 INSERT  values）。
- **使用场景**：批量查询（`IN` 条件）、批量插入、批量更新。
- **示例1：批量查询（IN 条件）**（见“参数传递”部分，此处略）。
- **示例2：批量插入（批量添加用户）**：
  ```xml
  <insert id="batchInsertUser">
      INSERT INTO user (username, age, birthday)
      VALUES
      <foreach collection="list" item="user" separator=",">
          (#{user.username}, #{user.age}, #{user.birthday})
      </foreach>
  </insert>
  ```  
  接口方法：`int batchInsertUser(@Param("list") List<User> userList);`
- **示例3：批量更新（按 ID 批量更新状态）**：
  ```xml
  <update id="batchUpdateStatus">
      UPDATE user
      SET status = #{status}
      WHERE id IN
      <foreach collection="ids" item="id" open="(" separator="," close=")">
          #{id}
      </foreach>
  </update>
  ```  
  接口方法：`int batchUpdateStatus(@Param("ids") List<Long> ids, @Param("status") Integer status);`

#### （5）set 标签（优化 UPDATE 语句）
- **作用**：自动处理 `SET` 关键字和多余的 `,`（若内部 if 标签拼接的 SQL 以 `,` 结尾，会自动剔除）。
- **使用场景**：动态更新字段（仅更新非 null 的字段）。
- **示例（动态更新用户信息）**：
  ```xml
  <update id="updateUserSelective">
      UPDATE user
      <set> <!-- 自动添加 SET，剔除多余 , -->
          <if test="username != null and username != ''">
              username = #{username}, <!-- 结尾的 , 会被剔除 -->
          </if>
          <if test="age != null">
              age = #{age},
          </if>
          <if test="birthday != null">
              birthday = #{birthday}
          </if>
      </set>
      WHERE id = #{id}
  </update>
  ```  
- **效果**：若仅更新 username 和 age，SQL 为 `UPDATE user SET username = ..., age = ... WHERE id = ...`（无多余 `,`）。

#### （6）trim 标签（自定义前缀/后缀处理）
- **作用**：更灵活的动态 SQL 处理，可自定义添加前缀（`prefix`）、后缀（`suffix`），剔除前缀多余字符（`prefixOverrides`）、后缀多余字符（`suffixOverrides`）。
- **使用场景**：替代 `where`/`set` 标签，或处理更复杂的拼接场景（如自定义 `WHERE` 或 `SET`）。
- **示例1：替代 where 标签**：
  ```xml
  <trim prefix="WHERE" prefixOverrides="AND|OR"> <!-- 前缀为 WHERE，剔除开头的 AND/OR -->
      <if test="username != null">
          AND username = #{username}
      </if>
  </trim>
  ```  
- **示例2：替代 set 标签**：
  ```xml
  <trim prefix="SET" suffixOverrides=","> <!-- 前缀为 SET，剔除结尾的 , -->
      <if test="username != null">
          username = #{username},
      </if>
  </trim>
  ```  

#### （7）sql 与 include 标签（SQL 片段复用）
- **作用**：`sql` 标签定义可复用的 SQL 片段，`include` 标签引用片段，减少重复代码。
- **使用场景**：多 SQL 语句共用相同片段（如查询字段、WHERE 条件）。
- **示例**：
  ```xml
  <!-- 定义 SQL 片段：查询 user 表的核心字段 -->
  <sql id="userCoreColumns">
      id, username, age, birthday, status
  </sql>

  <!-- 引用片段：查询用户 -->
  <select id="selectUserById" resultType="user">
      SELECT <include refid="userCoreColumns"/> FROM user WHERE id = #{id}
  </select>

  <!-- 引用片段：分页查询用户 -->
  <select id="selectUserByPage" resultType="user">
      SELECT <include refid="userCoreColumns"/> FROM user
      <where>...</where>
      LIMIT #{offset}, #{pageSize}
  </select>
  ```  
- **进阶**：片段支持参数传递（通过 `property` 标签）：
  ```xml
  <sql id="dynamicColumns">
      ${prefix}.id, ${prefix}.username <!-- 引用外部参数 prefix -->
  </sql>

  <select id="selectJoin" resultType="user">
      SELECT 
          <include refid="dynamicColumns">
              <property name="prefix" value="u"/> <!-- 传递参数 prefix=u -->
          </include>
      FROM user u JOIN order o ON u.id = o.user_id
  </select>
  ```


## 五、MyBatis 缓存
### 1. MyBatis 缓存分为哪几级？各级缓存的作用域、开启方式和失效场景是什么？
**答案**：  
MyBatis 缓存分为 **一级缓存（SqlSession 级别）** 和 **二级缓存（namespace 级别）**，默认仅开启一级缓存，二级缓存需手动开启。

| 缓存级别       | 作用域                | 开启方式                                                                 | 失效场景                                                                 |
|----------------|-----------------------|--------------------------------------------------------------------------|--------------------------------------------------------------------------|
| 一级缓存（本地缓存） | SqlSession（会话级）  | 默认开启（无需配置）                                                     | 1. 执行 `commit()`/`rollback()`（事务提交/回滚）；2. 执行 `clearCache()`；3. 执行同 SqlSession 内的 `insert`/`update`/`delete`；4. SqlSession 关闭/销毁 |
| 二级缓存（全局缓存） | namespace（Mapper 级）| 1. 全局配置 `cacheEnabled=true`（默认开启）；2. Mapper XML 中添加 `<cache/>` 或接口用 `@CacheNamespace` | 1. 同 namespace 内执行 `insert`/`update`/`delete`；2. 缓存对象未实现 `Serializable`（序列化）；3. 标签配置 `flushCache="true"`（默认 `select` 为 false，`insert` 为 true） |

#### （1）一级缓存（SqlSession 级别）
- **原理**：MyBatis 为每个 `SqlSession` 维护一个本地缓存（`PerpetualCache`），同一 `SqlSession` 内执行“相同 SQL + 相同参数”的查询时，首次查询从数据库获取结果并存入缓存，后续查询直接从缓存读取，避免重复访问数据库。
- **“相同 SQL + 相同参数”的判定标准**：
    1. SQL 语句完全一致（包括空格、注释）。
    2. 参数值完全一致（如 `id=1` 与 `id=1` 一致，`id=1` 与 `id=2` 不一致）。
    3. 分页参数（`rowBounds`）、排序参数一致。
- **示例（一级缓存生效）**：
  ```java
  try (SqlSession session = sqlSessionFactory.openSession()) {
      UserMapper mapper = session.getMapper(UserMapper.class);
      // 第一次查询：从数据库获取，存入一级缓存
      User user1 = mapper.selectById(1L); 
      // 第二次查询：参数相同，从一级缓存获取（无数据库访问）
      User user2 = mapper.selectById(1L); 
      System.out.println(user1 == user2); // true（同一对象）
  }
  ```  
- **失效场景验证**：
  ```java
  try (SqlSession session = sqlSessionFactory.openSession()) {
      UserMapper mapper = session.getMapper(UserMapper.class);
      User user1 = mapper.selectById(1L); 
      // 执行 update 操作：一级缓存失效
      mapper.updateUsername(1L, "李四"); 
      session.commit(); // 事务提交，进一步确保缓存失效
      // 第三次查询：缓存已失效，重新从数据库获取
      User user3 = mapper.selectById(1L); 
      System.out.println(user1 == user3); // false（不同对象）
  }
  ```

#### （2）二级缓存（namespace 级别）
- **原理**：二级缓存是跨 `SqlSession` 的缓存，作用域为 `namespace`（即一个 Mapper 接口），多个 `SqlSession` 执行同一 Mapper 的“相同 SQL + 相同参数”查询时，共享二级缓存（首次查询存入二级缓存，后续 `SqlSession` 直接读取）。
- **开启步骤**：
    1. 全局配置开启二级缓存（`mybatis-config.xml`，默认已开启）：
       ```xml
       <settings>
           <setting name="cacheEnabled" value="true"/>
       </settings>
       ```  
    2. 在 Mapper XML 中添加 `<cache/>` 标签（或接口用 `@CacheNamespace` 注解）：
       ```xml
       <!-- UserMapper.xml 中添加 -->
       <cache 
           eviction="LRU" <!-- 缓存淘汰策略：LRU（最近最少使用，默认）、FIFO、SOFT、WEAK -->
           flushInterval="60000" <!-- 缓存刷新间隔（毫秒，60秒），0 表示不自动刷新 -->
           size="1024" <!-- 缓存最大条目数 -->
           readOnly="false"/> <!-- 是否只读：false（默认，缓存对象可修改，返回副本）；true（缓存对象不可修改，返回原对象） -->
       ```  
    3. 缓存对象必须实现 `Serializable` 接口（二级缓存可能将对象序列化到磁盘，避免内存溢出）：
       ```java
       class User implements Serializable { // 实现序列化接口
           private Long id;
           private String username;
           // ...
       }
       ```  
- **示例（二级缓存生效）**：
  ```java
  // 第一个 SqlSession：查询并存入二级缓存
  try (SqlSession session1 = sqlSessionFactory.openSession()) {
      UserMapper mapper1 = session1.getMapper(UserMapper.class);
      User user1 = mapper1.selectById(1L); 
      session1.commit(); // 必须提交事务，二级缓存才会写入（默认配置）
  }

  // 第二个 SqlSession：从二级缓存获取
  try (SqlSession session2 = sqlSessionFactory.openSession()) {
      UserMapper mapper2 = session2.getMapper(UserMapper.class);
      User user2 = mapper2.selectById(1L); // 从二级缓存获取，无数据库访问
  }
  ```  
- **失效场景**：
    1. 同 namespace 内执行 `insert`/`update`/`delete` 操作（默认会清空该 namespace 的二级缓存）。
    2. 标签配置 `flushCache="true"`（如 `<select flushCache="true">`，查询后清空缓存）。
    3. 缓存对象未实现 `Serializable`（抛出 `NotSerializableException`）。
    4. 全局配置 `cacheEnabled="false"`（关闭所有二级缓存）。


### 2. 如何整合 MyBatis 二级缓存与 Redis（第三方缓存）？
**答案**：  
MyBatis 二级缓存默认使用 `PerpetualCache`（内存缓存），仅适用于单机环境；分布式环境下需整合 Redis（分布式缓存），实现多服务共享缓存。整合步骤如下：

#### （1）核心原理
MyBatis 提供 `Cache` 接口，自定义 Redis 缓存需实现该接口，替换默认的 `PerpetualCache`，让 MyBatis 从 Redis 读写缓存数据。

#### （2）整合步骤
##### ① 引入依赖（Redis 客户端，如 Jedis 或 Spring Data Redis）
```xml
<!-- Maven 依赖 -->
<dependencies>
    <!-- MyBatis -->
    <dependency>
        <groupId>org.mybatis</groupId>
        <artifactId>mybatis</artifactId>
        <version>3.5.15</version>
    </dependency>
    <!-- Redis 客户端（Jedis） -->
    <dependency>
        <groupId>redis.clients</groupId>
        <artifactId>jedis</artifactId>
        <version>4.5.0</version>
    </dependency>
    <!-- 序列化工具（FastJSON，用于对象序列化） -->
    <dependency>
        <groupId>com.alibaba</groupId>
        <artifactId>fastjson</artifactId>
        <version>2.0.44</version>
    </dependency>
</dependencies>
```

##### ② 实现 MyBatis 的 Cache 接口（自定义 Redis 缓存）
```java
import org.apache.ibatis.cache.Cache;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPool;
import redis.clients.jedis.JedisPoolConfig;
import com.alibaba.fastjson.JSON;
import java.util.concurrent.locks.ReadWriteLock;
import java.util.concurrent.locks.ReentrantReadWriteLock;

public class RedisCache implements Cache {
    private final String id; // namespace（Mapper 接口全类名）
    private final JedisPool jedisPool;
    private final ReadWriteLock readWriteLock = new ReentrantReadWriteLock(); // 读写锁
    private static final int EXPIRE_TIME = 3600; // 缓存过期时间（秒）

    // 构造方法：MyBatis 会自动传入 namespace 作为 id
    public RedisCache(String id) {
        if (id == null) {
            throw new IllegalArgumentException("Cache id can not be null!");
        }
        this.id = id;
        // 初始化 Redis 连接池
        JedisPoolConfig poolConfig = new JedisPoolConfig();
        poolConfig.setMaxTotal(100);
        poolConfig.setMaxIdle(20);
        this.jedisPool = new JedisPool(poolConfig, "localhost", 6379); // Redis 地址和端口
    }

    // 获取缓存 id（namespace）
    @Override
    public String getId() {
        return this.id;
    }

    // 存入缓存：key 为缓存键（SQL+参数的哈希值），value 为序列化后的对象
    @Override
    public void putObject(Object key, Object value) {
        try (Jedis jedis = jedisPool.getResource()) {
            String redisKey = getRedisKey(key); // 生成 Redis 键（namespace:key）
            String redisValue = JSON.toJSONString(value); // 对象序列化为 JSON
            jedis.setex(redisKey, EXPIRE_TIME, redisValue); // 存入 Redis 并设置过期时间
        }
    }

    // 获取缓存：根据 key 获取序列化前的对象
    @Override
    public Object getObject(Object key) {
        try (Jedis jedis = jedisPool.getResource()) {
            String redisKey = getRedisKey(key);
            String redisValue = jedis.get(redisKey);
            if (redisValue == null) {
                return null;
            }
            // 反序列化：根据缓存对象类型（此处简化，实际需处理泛型）
            return JSON.parseObject(redisValue, Object.class);
        }
    }

    // 移除缓存（MyBatis 不一定会调用，需手动处理）
    @Override
    public Object removeObject(Object key) {
        try (Jedis jedis = jedisPool.getResource()) {
            String redisKey = getRedisKey(key);
            return jedis.del(redisKey);
        }
    }

    // 清空缓存（执行 insert/update/delete 时调用）
    @Override
    public void clear() {
        try (Jedis jedis = jedisPool.getResource()) {
            String pattern = this.id + ":*"; // 匹配当前 namespace 下的所有缓存键
            jedis.keys(pattern).forEach(jedis::del); // 删除所有匹配的键
        }
    }

    // 获取缓存大小（可选实现）
    @Override
    public int getSize() {
        try (Jedis jedis = jedisPool.getResource()) {
            String pattern = this.id + ":*";
            return jedis.keys(pattern).size();
        }
    }

    // 获取读写锁（可选实现，用于线程安全）
    @Override
    public ReadWriteLock getReadWriteLock() {
        return this.readWriteLock;
    }

    // 生成 Redis 键：格式为 "namespace:keyHash"（避免不同 Mapper 的 key 冲突）
    private String getRedisKey(Object key) {
        return this.id + ":" + key.hashCode();
    }
}
```

##### ③ 在 Mapper 中指定自定义缓存（替换默认缓存）
在 Mapper XML 中通过 `cache` 标签的 `type` 属性指定自定义 `RedisCache`：
```xml
<!-- UserMapper.xml -->
<cache 
    type="com.xxx.cache.RedisCache" <!-- 自定义 Redis 缓存全类名 -->
    eviction="LRU"
    flushInterval="3600000"
    size="1024"
    readOnly="false"/>
```  
或在 Mapper 接口用 `@CacheNamespace` 注解：
```java
import org.apache.ibatis.annotations.CacheNamespace;

@CacheNamespace(implementation = RedisCache.class) // 指定自定义缓存实现
public interface UserMapper {
    // ...
}
```

##### ④ 测试分布式缓存
启动多个服务实例，执行相同 Mapper 的查询：
- 第一个实例查询：从数据库获取，存入 Redis 缓存。
- 第二个实例查询：从 Redis 缓存获取，无需访问数据库，实现分布式缓存共享。

#### （3）注意事项
1. **序列化问题**：缓存对象必须可序列化（如实现 `Serializable` 或用 JSON 序列化），避免 Redis 存储失败。
2. **键冲突**：Redis 键需包含 `namespace`（如 `com.xxx.mapper.UserMapper:123456`），避免不同 Mapper 的缓存键冲突。
3. **过期时间**：设置合理的缓存过期时间（如 1 小时），避免缓存数据过时（或在数据更新时主动清空缓存）。
4. **Redis 高可用**：生产环境需使用 Redis 集群（主从+哨兵），避免 Redis 单点故障导致缓存不可用。


## 六、MyBatis 高级特性与问题排查
### 1. MyBatis 插件（Interceptor）的原理是什么？如何开发一个自定义插件（如 SQL 日志打印插件）？
**答案**：
#### （1）插件原理
MyBatis 插件基于 **动态代理** 和 **责任链模式** 实现，通过拦截 MyBatis 核心组件的方法（如 `Executor` 的 `query`/`update` 方法、`StatementHandler` 的 `prepare` 方法），在方法执行前后插入自定义逻辑（如修改 SQL、打印日志、添加权限过滤）。

MyBatis 允许拦截的核心组件及方法：  
| 拦截组件               | 可拦截方法                                                                 |
|------------------------|--------------------------------------------------------------------------|
| Executor               | `update`（执行 insert/update/delete）、`query`（执行 select）、`commit`、`rollback` |
| StatementHandler       | `prepare`（创建 Statement）、`parameterize`（设置参数）、`query`（执行查询） |
| ParameterHandler       | `setParameters`（设置 PreparedStatement 参数）                            |
| ResultSetHandler       | `handleResultSets`（处理结果集映射）                                      |

#### （2）自定义插件开发步骤（以 SQL 日志打印插件为例）
开发一个插件，拦截 `StatementHandler` 的 `prepare` 方法，打印执行前的 SQL 语句和参数。

##### ① 实现 Interceptor 接口
```java
import org.apache.ibatis.executor.statement.StatementHandler;
import org.apache.ibatis.plugin.*;
import org.apache.ibatis.session.ResultHandler;
import java.sql.Connection;
import java.util.Properties;

// @Intercepts：指定拦截的组件和方法（多个 @Signature 表示多方法拦截）
@Intercepts({
    @Signature(
        type = StatementHandler.class, // 拦截的组件类型
        method = "prepare", // 拦截的方法名
        args = {Connection.class, Integer.class} // 拦截方法的参数类型（用于匹配方法）
    )
})
public class SqlLogInterceptor implements Interceptor {
    // 核心拦截逻辑：方法执行前后的自定义处理
    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        // 1. 获取被拦截的对象（StatementHandler）
        StatementHandler statementHandler = (StatementHandler) invocation.getTarget();
        
        // 2. 从 StatementHandler 中获取 SQL 语句（通过 MetaObject 反射获取私有属性）
        MetaObject metaObject = SystemMetaObject.forObject(statementHandler);
        String sql = (String) metaObject.getValue("delegate.boundSql.sql"); // 获取绑定的 SQL
        
        // 3. 获取 SQL 参数（BoundSql 中的 parameterObject）
        Object parameterObject = metaObject.getValue("delegate.boundSql.parameterObject");
        
        // 4. 打印 SQL 日志（自定义逻辑）
        System.out.println("===== MyBatis SQL Log =====");
        System.out.println("SQL: " + sql);
        System.out.println("Parameters: " + parameterObject);
        System.out.println("===========================");
        
        // 5. 执行原方法（继续 MyBatis 流程）
        return invocation.proceed();
    }

    // 生成代理对象：MyBatis 自动调用，为被拦截组件创建代理
    @Override
    public Object plugin(Object target) {
        // 用 Plugin 工具类生成代理（避免手动创建代理）
        return Plugin.wrap(target, this);
    }

    // 设置插件属性：从 MyBatis 配置中读取插件参数（如日志级别）
    @Override
    public void setProperties(Properties properties) {
        // 示例：读取配置的日志级别（如 <property name="logLevel" value="DEBUG"/>）
        String logLevel = properties.getProperty("logLevel");
        System.out.println("SqlLogInterceptor logLevel: " + logLevel);
    }
}
```

##### ② 在 MyBatis 核心配置文件中注册插件
```xml
<plugins>
    <plugin interceptor="com.xxx.plugin.SqlLogInterceptor">
        <!-- 插件参数（会传入 setProperties 方法） -->
        <property name="logLevel" value="DEBUG"/>
    </plugin>
</plugins>
```

##### ③ 测试插件效果
执行 Mapper 查询方法，控制台会打印 SQL 日志：
```
===== MyBatis SQL Log =====
SQL: SELECT id, username, age FROM user WHERE id = ?
Parameters: 1
===========================
```

#### （3）插件开发注意事项
1. **拦截方法匹配**：`@Signature` 的 `args` 参数必须与被拦截方法的参数类型完全一致（如 `StatementHandler.prepare` 方法参数为 `(Connection, Integer)`，不可写错）。
2. **MetaObject 反射**：MyBatis 提供 `SystemMetaObject` 工具类，用于安全访问对象的私有属性（避免直接用反射导致的权限问题）。
3. **执行原方法**：必须调用 `invocation.proceed()` 继续 MyBatis 流程，否则会中断 SQL 执行。
4. **插件顺序**：多个插件按配置顺序执行（先配置的先拦截），可通过 `@Intercepts` 控制拦截优先级。
5. **性能影响**：插件会增加方法调用开销，避免过度使用（如仅在开发/测试环境启用 SQL 日志插件）。


### 2. MyBatis 常见错误有哪些？如何排查和解决？
**答案**：  
MyBatis 开发中常见错误及排查方案如下：

#### （1）BindingException：Invalid bound statement (not found)
- **错误原因**：Mapper 接口与 XML 映射不匹配（如 namespace 错误、id 不匹配、Mapper 未注册）。
- **排查步骤**：
    1. 检查 XML 的 `namespace` 是否与 Mapper 接口全类名完全一致（如 `com.xxx.mapper.UserMapper`）。
    2. 检查 XML 标签 `id` 是否与接口方法名完全一致（如方法 `selectById` vs XML id `selectUserById`）。
    3. 检查 Mapper 是否已注册（`mybatis-config.xml` 中是否通过 `mapper`/`package` 标签注册）。
    4. 检查 XML 文件是否被正确打包（Maven 项目需配置资源过滤，确保 XML 在 `classes` 目录下）。

#### （2）SQLSyntaxErrorException：SQL 语法错误
- **错误原因**：XML 中的 SQL 存在语法错误（如关键字拼写错误、字段名错误、缺少分号）。
- **排查步骤**：
    1. 开启 MyBatis 日志，打印执行的 SQL 语句（配置 `logImpl=Slf4jImpl` 或 `LOG4J`）。
    2. 将打印的 SQL 直接在数据库客户端（如 Navicat）执行，定位语法错误（如 `SELEC * FROM user` 少写 `T`）。
    3. 检查动态 SQL 拼接结果（如 `foreach` 标签是否多拼 `,`，`where` 标签是否多余 `AND`）。

#### （3）TypeException：参数类型不匹配
- **错误原因**：XML 中引用的参数类型与接口方法参数类型不匹配（如 `#{age}` 对应接口方法参数为 `String`，但数据库字段为 `int`）。
- **排查步骤**：
    1. 检查接口方法参数类型（如 `Integer age`）与 XML 中 `#{age}` 对应的数据库字段类型是否一致。
    2. 检查多参数传递是否用 `@Param` 注解（未用则需用 `param1`/`param2` 引用）。
    3. 检查 `parameterType` 是否正确（如 `parameterType="user"` 对应接口方法参数为 `User`）。

#### （4）ResultMapException：结果映射错误
- **错误原因**：`resultMap` 配置错误（如字段名与属性名不匹配、关联查询标签错误）。
- **排查步骤**：
    1. 检查 `resultMap` 中 `column` 是否与数据库字段名一致（或开启 `mapUnderscoreToCamelCase` 处理驼峰）。
    2. 检查关联查询标签：`association`（一对一）是否误写为 `collection`（一对多），`ofType` 是否正确。
    3. 检查返回类型：`resultType` 是否与接口方法返回类型一致（如方法返回 `List<User>`，`resultType="user"`）。

#### （5）一级缓存导致的脏数据问题
- **错误原因**：同一 `SqlSession` 内执行查询后，数据库数据被修改，但一级缓存未更新，导致后续查询获取旧数据。
- **排查步骤**：
    1. 确认是否在同一 `SqlSession` 内执行了查询和数据修改（如 `select` 后执行 `update` 但未 `commit`）。
    2. 解决方案：
        - 执行 `update`/`delete`/`insert` 后调用 `sqlSession.clearCache()` 清除一级缓存。
        - 不同操作使用不同的 `SqlSession`（推荐，`SqlSession` 应短期持有，使用后关闭）。
        - 禁用一级缓存（不推荐，影响性能）：在标签中配置 `flushCache="true"`（如 `<select flushCache="true">`）。

#### （6）N+1 查询问题（关联查询性能问题）
- **错误原因**：嵌套查询（如一对多）时，先查询主表（1 次），再根据主表结果查询从表（N 次），导致数据库访问次数过多。
- **排查步骤**：
    1. 检查关联查询是否使用“嵌套查询”（`association`/`collection` 的 `select` 属性）。
    2. 解决方案：
        - 改用“嵌套结果”（单 SQL 关联查询，如 `LEFT JOIN`），减少数据库访问次数。
        - 开启延迟加载（`lazyLoadingEnabled=true`），仅在访问关联对象时才执行从表查询（避免不必要的 N 次查询）。


## 七、MyBatis 性能优化
### 1. MyBatis 性能优化有哪些常用手段？
**答案**：  
MyBatis 性能优化需从“SQL 优化、缓存优化、参数处理、连接池优化”等维度入手，常用手段如下：

#### （1）SQL 优化（核心）
1. **避免 select *，只查询需要的字段**：减少数据传输量和数据库 IO，如 `SELECT id, username FROM user` 而非 `SELECT * FROM user`。
2. **优化 WHERE 条件**：
    - 避免使用 `NOT IN`、`!=`、`IS NULL`（可能导致索引失效），改用 `IN`、`=`、`IS NOT NULL`。
    - 模糊查询优先用 `LEFT(SUBSTRING)` 替代 `%XXX%`（如 `username LIKE '张%'` 可走索引，`%张%` 不可）。
3. **使用索引**：为 WHERE 条件、JOIN 关联字段、ORDER BY 字段创建索引（避免过度索引，影响写入性能）。
4. **批量操作替代循环操作**：
    - 批量插入：用 `foreach` 标签实现单 SQL 批量插入（`INSERT INTO user VALUES (...), (...), (...)`），避免循环调用 `insert`（减少 SQL 执行次数）。
    - 批量更新：用 `CASE WHEN` 实现单 SQL 批量更新，或用 `foreach` 拼接 `IN` 条件（如批量更新状态）。
5. **分页优化**：
    - 用物理分页（如 MySQL 的 `LIMIT`、Oracle 的 `ROWNUM`），避免逻辑分页（`RowBounds`，查询所有数据后内存分页，数据量大时性能差）。
    - 使用分页插件（如 PageHelper），自动生成物理分页 SQL，简化分页代码。

#### （2）缓存优化
1. **合理使用二级缓存**：
    - 对查询频繁、修改少的数据（如字典表、配置表）开启二级缓存，减少数据库访问。
    - 分布式环境下整合 Redis 作为二级缓存，实现多服务共享缓存。
2. **控制缓存粒度**：
    - 避免缓存大对象（如包含大量字段的表），拆分缓存（如仅缓存高频访问的字段）。
    - 设置合理的缓存过期时间（如 1 小时），避免缓存数据过时。
3. **禁用不必要的缓存**：
    - 对实时性要求高的数据（如用户余额、订单状态）禁用缓存，直接查询数据库。
    - 执行 `insert`/`update`/`delete` 后自动清空对应缓存（MyBatis 默认行为），避免脏数据。

#### （3）参数与映射优化
1. **使用 #{} 替代 ${}**：避免 SQL 注入，利用 PreparedStatement 预编译提升性能。
2. **开启驼峰命名映射**：配置 `mapUnderscoreToCamelCase=true`，自动处理数据库字段 `user_name` 到 Java 属性 `userName` 的映射，避免手动配置 `resultMap`。
3. **优化参数传递**：
    - 多参数传递优先用 `@Param` 注解或封装为 POJO，避免 `param1/param2`（提升可读性，减少映射错误）。
    - 集合参数用 `foreach` 标签时，指定 `collection` 名称（如 `@Param("ids") List<Long> ids`），避免歧义。
4. **使用 ResultMap 复用映射规则**：对复杂查询（如关联查询）定义 `resultMap`，避免重复配置映射关系，提升维护效率。

#### （4）连接池与执行器优化
1. **使用连接池（POOLED）**：MyBatis 数据源默认支持 `POOLED`（连接池），避免频繁创建/关闭数据库连接（连接池复用连接，减少 IO 开销）。
2. **优化连接池参数**：
    - `maxTotal`：连接池最大连接数（根据并发量设置，如 100）。
    - `maxIdle`：连接池最大空闲连接数（如 20，避免频繁创建连接）。
    - `maxWaitMillis`：获取连接的最大等待时间（如 3000 毫秒，避免线程无限阻塞）。
3. **选择合适的执行器（Executor）**：
    - MyBatis 执行器类型：`SIMPLE`（默认，每次执行 SQL 新建 Statement）、`REUSE`（复用 Statement）、`BATCH`（批量执行 SQL，适合批量插入/更新）。  
  