# Java资深开发面试大纲

## 1. Java核心基础
- **面向对象**：封装、继承、多态的理解，重载与重写的区别。
- **异常体系**：运行时异常与非运行时异常，异常处理机制（try-catch-finally，try-with-resources）。
- **集合框架**：
  - List、Set、Map的底层实现（ArrayList、LinkedList、HashMap、LinkedHashMap、TreeMap、HashSet、TreeSet等）。
  - ConcurrentHashMap的原理与分段锁/ CAS 机制。
  - 迭代器与快速失败（fail-fast）机制。
- **泛型**：类型擦除、通配符、泛型方法。
- **反射**：类加载机制，反射的应用场景（框架、动态代理）。
- **注解**：元注解、自定义注解、注解处理器。
- **Java 8+新特性**：
  - Lambda表达式、函数式接口。
  - Stream API的操作与原理（中间操作、终端操作、并行流）。
  - Optional类的使用。
  - 新的日期时间API（LocalDate、LocalDateTime）。
  - 接口默认方法和静态方法。

## 2. 并发编程
- **线程基础**：
  - 线程的生命周期与状态转换。
  - 创建线程的方式（Thread、Runnable、Callable、FutureTask、线程池）。
- **线程池**：
  - ThreadPoolExecutor的核心参数（corePoolSize、maximumPoolSize、keepAliveTime、工作队列、拒绝策略）。
  - 常用线程池（FixedThreadPool、CachedThreadPool、ScheduledThreadPool）的适用场景。
  - 线程池的监控与动态调整。
- **锁机制**：
  - synchronized的原理（对象头、Monitor、锁升级：偏向锁、轻量级锁、重量级锁）。
  - Lock接口（ReentrantLock、ReentrantReadWriteLock、StampedLock）与AQS（AbstractQueuedSynchronizer）原理。
  - Condition的使用与实现。
  - 公平锁与非公平锁的区别。
- **并发工具类**：
  - CountDownLatch、CyclicBarrier、Semaphore、Exchanger。
  - BlockingQueue（ArrayBlockingQueue、LinkedBlockingQueue、SynchronousQueue、PriorityBlockingQueue）的应用与原理。
  - ConcurrentHashMap、CopyOnWriteArrayList等并发容器的实现。
- **原子类与CAS**：
  - 原子类的实现（AtomicInteger、AtomicReference、LongAdder）。
  - CAS的原理与ABA问题解决（AtomicStampedReference）。
- **volatile**：可见性与禁止指令重排序，与synchronized的区别。
- **ThreadLocal**：原理、内存泄漏分析、应用场景（如数据库连接、Session管理）。
- **并发编程模型**：生产者消费者模式、读写锁分离、并行流水线。

## 3. JVM（Java虚拟机）
- **内存区域**：
  - 程序计数器、虚拟机栈、本地方法栈、堆、方法区（元空间）、运行时常量池。
  - 直接内存（Direct Memory）。
- **对象创建与访问**：
  - 对象的创建过程（类加载检查、分配内存、初始化零值、设置对象头、执行构造方法）。
  - 对象的内存布局（对象头、实例数据、对齐填充）。
  - 对象的访问定位（句柄池、直接指针）。
- **垃圾回收（GC）**：
  - 判断对象存活（引用计数法、可达性分析），GC Roots。
  - 引用类型（强引用、软引用、弱引用、虚引用）。
  - 垃圾回收算法（标记-清除、复制、标记-整理、分代收集）。
  - 垃圾收集器（Serial、ParNew、Parallel Scavenge、CMS、G1、ZGC、Shenandoah）的特点、工作原理及适用场景。
  - GC日志分析与调优。
- **类加载机制**：
  - 类加载过程（加载、验证、准备、解析、初始化）。
  - 类加载器（Bootstrap、Extension、Application、自定义类加载器）及双亲委派模型。
  - 打破双亲委派的场景（Tomcat、OSGi、JDBC）。
- **JVM调优**：
  - 常用JVM参数（堆大小设置、新生代与老年代比例、GC日志参数、OOM处理等）。
  - 内存泄漏分析与排查（MAT、JProfiler、jstack、jmap、jstat）。
  - CPU飙高、频繁GC问题的定位与解决。

## 4. 数据结构与算法
- **常用数据结构**：
  - 数组、链表（单向、双向、循环）、栈、队列。
  - 树：二叉树、平衡二叉树（AVL）、红黑树、B树、B+树。
  - 哈希表：哈希冲突解决（链地址法、开放地址法、再哈希法）。
  - 堆（大顶堆、小顶堆）的实现与应用。
- **算法**：
  - 排序：快速排序、归并排序、堆排序、计数排序、桶排序等（时间复杂度、稳定性）。
  - 查找：二分查找、二叉搜索树查找。
  - 字符串匹配：KMP、Boyer-Moore。
  - 动态规划、贪心算法、回溯、分治的基本思想。
  - 常见算法题（LeetCode Hot 100）：链表反转、LRU缓存、Top K、二叉树遍历（递归/非递归）、路径总和等。
- **复杂度分析**：时间复杂度（大O表示法）、空间复杂度。

## 5. 常用框架
- **Spring Framework**：
  - IOC（控制反转）与DI（依赖注入）原理，Bean的生命周期，Bean的作用域。
  - AOP（面向切面编程）原理（JDK动态代理、CGLIB），AOP应用场景（事务、日志、权限）。
  - 事务管理：声明式事务（@Transactional）的实现原理，事务传播行为、隔离级别。
  - Spring事件机制（ApplicationEvent、ApplicationListener）。
  - Spring MVC流程：DispatcherServlet、HandlerMapping、HandlerAdapter、ViewResolver。
- **Spring Boot**：
  - 自动配置原理（@SpringBootApplication、@EnableAutoConfiguration、Spring.factories）。
  - Starter机制，自定义Starter。
  - 配置文件加载顺序，属性绑定（@ConfigurationProperties）。
  - 嵌入式Web容器（Tomcat、Jetty、Undertow）的配置与切换。
  - Actuator监控端点，健康检查。
- **Spring Cloud（微服务相关）**：
  - 服务注册与发现（Eureka、Consul、Nacos）的原理与高可用。
  - 服务调用（Ribbon负载均衡策略、Feign的使用与原理）。
  - 断路器（Hystrix、Sentinel、Resilience4j）的工作原理与熔断降级策略。
  - 网关（Zuul、Spring Cloud Gateway）的路由、过滤器链。
  - 配置中心（Spring Cloud Config、Apollo、Nacos Config）的动态刷新。
  - 分布式追踪（Sleuth、Zipkin）。
- **ORM框架**：
  - MyBatis：核心组件（SqlSessionFactory、SqlSession、Mapper），一级缓存与二级缓存，延迟加载，动态SQL。
  - Hibernate：ORM映射、缓存机制、懒加载，与MyBatis的区别。

## 6. 数据库
- **MySQL**：
  - 存储引擎：InnoDB与MyISAM的区别（事务、锁、索引、MVCC）。
  - 索引：
    - 索引数据结构（B+树）及优势。
    - 聚簇索引与非聚簇索引，覆盖索引，最左前缀原则。
    - 索引失效场景分析（类型转换、函数计算、LIKE通配符等）。
    - Explain执行计划（type、key、rows、Extra等字段分析）。
  - 事务：
    - ACID特性，事务隔离级别（读未提交、读已提交、可重复读、串行化）及解决的问题（脏读、不可重复读、幻读）。
    - MVCC（多版本并发控制）原理，实现可重复读与避免幻读（Next-Key Lock）。
  - 锁：
    - 表锁、行锁、间隙锁、临键锁。
    - 乐观锁与悲观锁的实现（版本号、select ... for update）。
  - SQL优化：慢查询分析，索引优化，分页优化，避免全表扫描。
  - 主从复制原理与配置（binlog、异步复制、半同步复制）。
  - 分库分表（ShardingSphere、MyCat）：垂直拆分、水平拆分，分片键选择，分布式ID生成策略（雪花算法、UUID、号段模式）。
- **NoSQL**：
  - **Redis**：
    - 数据结构（String、Hash、List、Set、Sorted Set、Bitmaps、HyperLogLog、Geo）及应用场景。
    - 持久化机制（RDB快照、AOF日志）的优缺点与配置。
    - 高可用：主从复制、哨兵模式、Cluster集群（数据分片、节点通信）。
    - 淘汰策略（LRU、LFU、TTL随机、禁止淘汰）及适用场景。
    - 缓存穿透、缓存击穿、缓存雪崩的解决方案。
    - 分布式锁的实现（SETNX + Lua脚本，Redisson框架）。
  - **MongoDB**：文档模型，索引，复制集，分片集群。
  - **Elasticsearch**：倒排索引，分词，查询DSL，集群架构。

## 7. 分布式与微服务
- **分布式理论**：
  - CAP理论（一致性、可用性、分区容错性）与BASE理论。
  - 分布式事务：
    - 两阶段提交（2PC）、三阶段提交（3PC）。
    - TCC（Try-Confirm-Cancel）方案。
    - 可靠消息最终一致性（RocketMQ事务消息、本地消息表）。
    - 最大努力通知。
  - Paxos、Raft共识算法基本思想。
- **服务治理**：
  - 注册中心：Eureka、Nacos、Consul、ZooKeeper的对比，服务健康检查机制。
  - 负载均衡：客户端负载（Ribbon） vs 服务端负载（Nginx）。
  - 服务路由、灰度发布。
- **分布式协调**：
  - ZooKeeper：节点类型、Watcher机制、ZAB协议，典型应用（服务发现、配置管理、分布式锁、选举）。
- **分布式缓存**：Redis Cluster、Codis，缓存一致性（更新策略、读写穿透）。
- **分布式会话**：Spring Session + Redis，Token（JWT）方案。
- **分布式链路追踪**：OpenTracing规范，SkyWalking、Pinpoint、Jaeger的实现原理。
- **分布式任务调度**：Quartz、Elastic-Job、XXL-JOB的原理与架构。
- **接口幂等性设计**：Token机制、数据库唯一索引、状态机。

## 8. 消息队列
- **消息模型**：点对点（Queue）、发布订阅（Topic）。
- **常用MQ对比**：Kafka、RabbitMQ、RocketMQ、ActiveMQ的特性与选型。
- **消息可靠性**：
  - 生产端：confirm机制、事务消息。
  - 服务端：持久化、同步刷盘、主从复制。
  - 消费端：手动ACK、重试机制、死信队列。
- **消息顺序性**：全局有序、局部有序的实现（Kafka分区内有序，RocketMQ MessageQueue）。
- **消息重复消费与幂等**：业务幂等设计（去重表、Redis标志位）。
- **消息堆积处理**：扩容消费者、临时队列、消息降级。
- **Kafka深入**：
  - 架构：Producer、Consumer、Broker、Topic、Partition、Offset。
  - 存储机制：Segment文件、索引文件。
  - 消费组与再均衡（Rebalance）机制。
  - 高性能设计：顺序写、零拷贝（sendfile）、页缓存。
- **RocketMQ深入**：NameServer、Broker、Producer、Consumer，事务消息实现，延迟消息。

## 9. 缓存
- **Redis**（已在上文数据库部分覆盖，此处强调缓存相关）
  - 缓存更新策略：Cache Aside、Read/Write Through、Write Behind。
  - 缓存一致性：数据库与缓存双写的一致性保证（延时双删、分布式锁）。
  - 缓存雪崩、穿透、击穿的解决方案（布隆过滤器、空值缓存、互斥锁）。
  - Redis性能优化：pipeline、Lua脚本、big key处理、热key发现。
- **本地缓存**：Guava Cache、Caffeine的原理（淘汰算法、缓存加载）。
- **多级缓存架构**：本地缓存 + 分布式缓存 + 热点数据预加载。

## 10. 设计模式
- **创建型**：单例（饿汉式、懒汉式、双重校验锁、静态内部类、枚举）、工厂（简单工厂、工厂方法、抽象工厂）、建造者、原型。
- **结构型**：适配器、装饰器、代理（静态代理、动态代理）、外观、桥接、组合、享元。
- **行为型**：策略、模板方法、观察者、责任链、迭代器、命令、状态、备忘录、中介者、解释器、访问者。
- **常用模式在源码中的应用**：
  - Spring中的单例、工厂（BeanFactory）、代理（AOP）、模板（JdbcTemplate）、观察者（事件机制）。
  - MyBatis中的建造者（SqlSessionFactoryBuilder）、模板（Executor）、代理（MapperProxy）。
  - JDK中的迭代器、装饰器（IO流）。

## 11. 网络编程与协议
- **TCP/IP协议**：
  - 三次握手、四次挥手的过程与状态（TIME_WAIT、CLOSE_WAIT）。
  - 流量控制（滑动窗口）、拥塞控制（慢启动、拥塞避免、快重传、快恢复）。
  - TCP与UDP的区别及适用场景。
- **HTTP/HTTPS**：
  - HTTP请求/响应结构，常见状态码（200、301、302、400、401、403、404、500、502、504）。
  - HTTP1.0、1.1、2.0的区别（持久连接、管道化、多路复用、头部压缩、服务器推送）。
  - HTTPS的握手过程（非对称加密+对称加密，证书验证）。
- **Socket编程**：BIO、NIO、AIO模型，Netty框架的核心组件（EventLoop、ChannelPipeline、ByteBuf），Reactor线程模型。
- **RPC框架**：
  - RPC原理：动态代理、序列化、网络传输、服务发现。
  - Dubbo架构：注册中心、Provider、Consumer、Monitor，SPI扩展机制，负载均衡策略。
  - gRPC：Protocol Buffers，HTTP/2支持，流式通信。

## 12. 系统设计与架构能力
- **设计原则**：SOLID原则（单一职责、开闭原则、里氏替换、接口隔离、依赖倒置）、DRY、KISS、YAGNI。
- **架构模式**：分层架构、微服务架构、事件驱动架构、CQRS、六边形架构。
- **高并发系统设计**：
  - 横向扩展（加机器）、纵向扩展（提升单机能力）。
  - 读写分离，数据库分库分表。
  - 缓存预热、降级、熔断、限流（令牌桶、漏桶、计数器、滑动窗口，Guava RateLimiter、Sentinel）。
  - 动静分离，CDN加速。
  - 异步化（消息队列、异步线程池）。
- **高可用设计**：
  - 冗余部署（多机房、多活）。
  - 故障自动转移（数据库主从切换、服务发现摘除节点）。
  - 超时与重试机制（含退避策略）。
  - 降级预案（开关配置、Mock数据）。
- **数据一致性与最终一致性**：分布式事务方案选择，幂等设计。
- **架构演进案例**：从单体到微服务的拆分策略，领域驱动设计（DDD）的基本概念（实体、值对象、聚合、领域服务、限界上下文）。

## 13. 开发工具与版本控制
- **版本控制**：Git（分支管理策略、rebase与merge的区别、reset与revert、冲突解决）、GitFlow工作流。
- **构建工具**：Maven（生命周期、坐标、依赖管理、插件）、Gradle（构建脚本、任务、依赖配置）。
- **IDE**：IntelliJ IDEA / Eclipse的常用快捷键、调试技巧、远程调试。
- **项目管理**：JIRA、Confluence、禅道等。

## 14. Linux基础与脚本
- **常用命令**：
  - 文件操作：ls、cd、cp、mv、rm、find、tar。
  - 权限管理：chmod、chown、chgrp。
  - 进程管理：ps、top、htop、kill、nohup。
  - 网络相关：netstat、ss、curl、wget、tcpdump。
  - 磁盘管理：df、du、fdisk、mount。
  - 文本处理：grep、awk、sed、vim。
- **Shell脚本编程**：变量、条件判断、循环、函数、定时任务（crontab）。
- **性能分析**：vmstat、iostat、sar、pidstat、perf。

## 15. 容器化与云原生
- **Docker**：
  - 镜像与容器概念，Dockerfile指令（FROM、RUN、COPY、ADD、CMD、ENTRYPOINT）。
  - 镜像分层与联合文件系统（AUFS、OverlayFS）。
  - 容器网络模式（bridge、host、none、container）。
  - 数据卷（Volume）与数据持久化。
  - Docker Compose编排多容器应用。
- **Kubernetes**：
  - 核心概念：Pod、Deployment、Service、Ingress、ConfigMap、Secret、Namespace。
  - 控制器：ReplicaSet、Deployment、StatefulSet、DaemonSet、Job、CronJob。
  - 服务发现与负载均衡（ClusterIP、NodePort、LoadBalancer、Ingress Controller）。
  - 存储卷（emptyDir、hostPath、PVC、StorageClass）。
  - 配置管理：ConfigMap、Secret。
  - 滚动更新与回滚，HPA（水平自动伸缩）。
- **Service Mesh**：Istio、Linkerd的基本概念（Sidecar、流量管理、可观测性、安全）。

## 16. 性能调优与监控
- **JVM调优**（已在JVM部分详述）。
- **应用性能监控**：
  - 日志监控：ELK/EFK（Elasticsearch、Logstash/Fluentd、Kibana）。
  - 指标监控：Prometheus + Grafana，Micrometer集成。
  - 调用链追踪：SkyWalking、Zipkin、Jaeger。
- **压力测试**：JMeter、LoadRunner、wrk，测试指标（TPS、QPS、RT、并发用户数、成功率）。
- **系统瓶颈分析**：CPU、内存、磁盘I/O、网络I/O的排查方法（top、vmstat、iostat、netstat、perf）。

## 17. 项目经验与软技能
- **项目介绍**：
  - 项目背景、业务价值、技术栈、团队规模、个人职责。
  - 系统架构图、核心模块、技术难点与解决方案。
- **技术选型**：为何选择某项技术，对比过哪些方案，优缺点分析。
- **疑难问题排查**：
  - 线上OOM、CPU飙升、死锁、接口超时等真实案例的排查过程与解决思路。
  - 如何利用日志、监控、线程Dump、堆Dump定位问题。
- **代码质量与规范**：
  - 代码Review经验，单元测试（JUnit、Mockito）、集成测试。
  - 代码重构与设计模式应用。
- **沟通协作**：
  - 跨团队协作、需求沟通、技术方案评审。
  - 指导新人、技术分享、团队建设。
- **项目管理**：敏捷开发（Scrum/Kanban）、任务分解、进度估算。

---

> 本大纲旨在覆盖Java资深开发岗位所需的核心知识体系，实际面试中会根据岗位职责有所侧重。建议结合个人项目经历，对每一点深入理解并能够举例说明。