# 模块四：JVM 原理与 GC ⭐

> 高频考点，P6/P7 必须掌握调优实战

---

## 1. JVM 运行时内存区域

### 1.1 内存区域划分

```
JVM 运行时数据区
├── 线程共享区域
│   ├── 堆（Heap）
│   │   ├── 新生代（Young Generation）
│   │   │   ├── Eden 区（80%）
│   │   │   ├── Survivor 0（10%）
│   │   │   └── Survivor 1（10%）
│   │   └── 老年代（Old Generation）
│   └── 方法区（Method Area）/ 元空间（Metaspace，JDK 8+）
│       ├── 类信息、字段、方法
│       ├── 运行时常量池
│       └── 静态变量（JDK 8 移到堆中）
└── 线程私有区域
    ├── 程序计数器（PC Register）
    ├── 虚拟机栈（VM Stack）
    │   └── 栈帧（Frame）
    │       ├── 局部变量表
    │       ├── 操作数栈
    │       ├── 动态链接
    │       └── 方法返回地址
    └── 本地方法栈（Native Method Stack）
```

### 1.2 各区域详解

**堆（Heap）**：
- 最大内存区域，存放对象实例和数组
- GC 主要工作区域
- 参数：`-Xms`（初始大小）、`-Xmx`（最大大小）

**方法区 / 元空间**：
- JDK 7：永久代（PermGen），使用 JVM 堆内存，`-XX:MaxPermSize`
- JDK 8+：元空间（Metaspace），使用**本地内存**，`-XX:MaxMetaspaceSize`
- 改为本地内存的原因：永久代大小难以预测，容易 OOM；元空间可以动态扩展

**程序计数器**：
- 唯一不会 OOM 的区域
- 记录当前线程执行的字节码行号
- 执行 native 方法时为 undefined

**虚拟机栈**：
- 每个方法调用创建一个栈帧
- `StackOverflowError`：栈深度超过限制（`-Xss`，默认 512K~1M）
- `OutOfMemoryError`：无法申请足够内存创建新线程

### 1.3 对象内存布局

```
对象内存布局（64位JVM，开启压缩指针）
├── 对象头（12字节）
│   ├── Mark Word（8字节）：hashCode、GC年龄、锁状态
│   └── Klass Pointer（4字节）：指向类元数据
├── 实例数据（字段）
│   └── 按类型对齐排列
└── 对齐填充（Padding）
    └── 保证对象大小是8字节的倍数
```

---

## 2. 类加载机制 ⭐

### 2.1 类加载过程

```
加载（Loading）
    ↓
验证（Verification）
    ↓
准备（Preparation）
    ↓
解析（Resolution）
    ↓
初始化（Initialization）
    ↓
使用（Using）
    ↓
卸载（Unloading）
```

**各阶段说明**：

| 阶段 | 工作内容 |
|------|----------|
| 加载 | 读取字节码，创建 Class 对象 |
| 验证 | 检查字节码合法性（魔数、版本、语义） |
| 准备 | 为静态变量分配内存，赋**零值**（非初始值） |
| 解析 | 将符号引用替换为直接引用 |
| 初始化 | 执行 `<clinit>` 方法（静态变量赋值 + 静态代码块） |

```java
// 准备阶段 vs 初始化阶段
class Foo {
    static int x = 10;
    // 准备阶段：x = 0（零值）
    // 初始化阶段：x = 10（执行赋值语句）
    
    static final int Y = 20;
    // 准备阶段：Y = 20（编译期常量，直接赋值）
}
```

### 2.2 双亲委派模型 ⭐

```
Bootstrap ClassLoader（启动类加载器）
    ↑ 委派
Extension ClassLoader（扩展类加载器）
    ↑ 委派
Application ClassLoader（应用类加载器）
    ↑ 委派
自定义 ClassLoader
```

**工作流程**：
1. 收到加载请求，先委派给父加载器
2. 父加载器无法加载（搜索范围内没有该类）才由子加载器加载

**好处**：
- 避免类的重复加载
- 保护核心类库（`java.lang.String` 只能由 Bootstrap 加载）

**破坏双亲委派的场景**：

| 场景 | 原因 | 示例 |
|------|------|------|
| JNDI/JDBC | SPI 机制，核心类需要加载第三方实现 | `Thread.currentThread().getContextClassLoader()` |
| OSGi | 模块化，每个 Bundle 有独立类加载器 | Eclipse 插件系统 |
| 热部署 | 需要重新加载修改后的类 | Tomcat、Spring DevTools |
| JDK 9 模块化 | 模块系统改变了加载逻辑 | - |

```java
// 自定义类加载器（不破坏双亲委派）
public class MyClassLoader extends ClassLoader {
    @Override
    protected Class<?> findClass(String name) throws ClassNotFoundException {
        byte[] bytes = loadClassBytes(name);  // 从自定义位置读取字节码
        return defineClass(name, bytes, 0, bytes.length);
    }
}

// 破坏双亲委派（重写 loadClass）
@Override
public Class<?> loadClass(String name) throws ClassNotFoundException {
    // 不委派给父加载器，直接自己加载
    if (name.startsWith("com.myapp.")) {
        return findClass(name);
    }
    return super.loadClass(name);
}
```

---

## 3. 对象创建与内存分配流程

### 3.1 对象创建流程

```
new 指令
    ↓
1. 检查类是否已加载（未加载则触发类加载）
    ↓
2. 分配内存
   ├── 指针碰撞（内存规整，Serial/ParNew）
   └── 空闲列表（内存不规整，CMS）
   并发安全：CAS + 失败重试 / TLAB（Thread Local Allocation Buffer）
    ↓
3. 初始化零值（不包括对象头）
    ↓
4. 设置对象头（Mark Word、Klass Pointer、GC年龄）
    ↓
5. 执行 <init> 方法（构造函数）
```

### 3.2 内存分配策略

```java
// 1. 优先在 Eden 区分配
// 2. 大对象直接进老年代（-XX:PretenureSizeThreshold）
// 3. 长期存活对象进老年代（默认年龄 15，-XX:MaxTenuringThreshold）
// 4. 动态年龄判断：Survivor 中相同年龄对象总大小 > Survivor 空间一半，
//    年龄 >= 该年龄的对象直接进老年代
// 5. 空间分配担保：Minor GC 前检查老年代剩余空间
```

---

## 4. GC 算法

### 4.1 三种基础算法

**标记-清除（Mark-Sweep）**：
- 标记存活对象，清除未标记对象
- 缺点：产生内存碎片，分配大对象时可能触发 GC

**标记-整理（Mark-Compact）**：
- 标记存活对象，将存活对象移到一端，清理边界外内存
- 优点：无碎片；缺点：移动对象成本高，需要 STW

**复制算法（Copying）**：
- 将内存分为两半，存活对象复制到另一半，清空当前半
- 优点：无碎片，分配效率高；缺点：内存利用率 50%
- 新生代使用改进版：Eden + 两个 Survivor（8:1:1），利用率 90%

### 4.2 可达性分析

```
GC Roots（根对象）
├── 虚拟机栈中引用的对象（局部变量）
├── 方法区中静态属性引用的对象
├── 方法区中常量引用的对象
├── 本地方法栈中 JNI 引用的对象
├── JVM 内部引用（基本类型 Class、常驻异常对象）
├── 同步锁持有的对象
└── JVM 内部情况（JMXBean、JVMTI 回调等）
```

**引用类型**：

| 类型 | 回收时机 | 使用场景 |
|------|----------|----------|
| 强引用 | 永不回收 | 普通对象引用 |
| 软引用（SoftReference） | 内存不足时回收 | 缓存（图片缓存） |
| 弱引用（WeakReference） | 下次 GC 时回收 | ThreadLocal、WeakHashMap |
| 虚引用（PhantomReference） | 随时回收，无法通过它获取对象 | 跟踪对象被回收的通知 |

---

## 5. 垃圾收集器详解 ⭐

### 5.1 收集器概览

```
新生代收集器：Serial、ParNew、Parallel Scavenge
老年代收集器：Serial Old、Parallel Old、CMS
全堆收集器：G1、ZGC、Shenandoah
```

### 5.2 CMS（Concurrent Mark Sweep）

**特点**：以最短停顿时间为目标，并发收集老年代

**四个阶段**：
1. **初始标记（STW）**：标记 GC Roots 直接关联的对象，速度快
2. **并发标记**：从 GC Roots 遍历对象图，与用户线程并发
3. **重新标记（STW）**：修正并发标记期间变动的对象（增量更新）
4. **并发清除**：清除死亡对象，与用户线程并发

**缺点**：
- 并发阶段占用 CPU 资源（默认 (CPU数+3)/4 个线程）
- 无法处理**浮动垃圾**（并发清除期间产生的新垃圾）
- 使用标记-清除，产生内存碎片
- 需要预留空间给并发阶段的对象分配（默认老年代 68% 时触发）

### 5.3 G1（Garbage First）⭐

**核心设计**：将堆划分为大小相等的 **Region**（1~32MB），每个 Region 可以是 Eden/Survivor/Old/Humongous（大对象）。

```
G1 堆结构
┌─────────────────────────────────────────┐
│ E │ S │ O │ H │ E │ O │ S │ E │ O │ H │
│ E │ O │ E │ O │ S │ E │ O │ E │ H │ O │
└─────────────────────────────────────────┘
E=Eden, S=Survivor, O=Old, H=Humongous
```

**四个阶段**：
1. **Young GC（STW）**：回收 Eden 和 Survivor Region
2. **并发标记**：类似 CMS，并发标记存活对象
3. **Mixed GC（STW）**：回收所有 Young Region + 部分 Old Region（优先回收垃圾最多的 Region）
4. **Full GC（STW）**：兜底，单线程，尽量避免

**关键参数**：
```bash
-XX:+UseG1GC                    # 启用 G1
-XX:MaxGCPauseMillis=200        # 目标停顿时间（默认200ms）
-XX:G1HeapRegionSize=4m         # Region 大小（1~32MB，2的幂）
-XX:G1NewSizePercent=5          # 新生代最小比例
-XX:G1MaxNewSizePercent=60      # 新生代最大比例
-XX:InitiatingHeapOccupancyPercent=45  # 触发并发标记的堆占用比例
```

**G1 vs CMS**：

| 维度 | CMS | G1 |
|------|-----|----|
| 适用区域 | 老年代 | 全堆 |
| 内存碎片 | 有 | 无（整理） |
| 停顿时间 | 短但不可预测 | 可设置目标停顿时间 |
| 吞吐量 | 较高 | 略低（整理有成本） |
| 适用场景 | 4GB 以下堆 | 大堆（6GB+） |

### 5.4 ZGC（Java 11+）

**特点**：停顿时间 < 10ms（与堆大小无关），支持 TB 级堆

**核心技术**：
- **着色指针（Colored Pointers）**：在指针中存储 GC 元数据（4位），无需额外内存
- **读屏障（Load Barrier）**：对象引用读取时检查指针状态，实现并发移动
- **并发整理**：几乎所有阶段都与用户线程并发

```bash
-XX:+UseZGC                     # 启用 ZGC（JDK 15+ 正式版）
-XX:ZCollectionInterval=5       # 定期 GC 间隔（秒）
-Xmx16g -Xms16g                 # 建议固定堆大小
```

**ZGC vs G1**：

| 维度 | G1 | ZGC |
|------|----|----|
| 停顿时间 | 可配置（默认200ms） | < 10ms |
| 吞吐量 | 高 | 略低（读屏障开销） |
| 堆大小 | 数GB | 数TB |
| JDK 版本 | JDK 7+ | JDK 11+（JDK 15 正式） |
| 适用场景 | 通用 | 超低延迟、超大堆 |

---

## 6. GC 调优实战

### 6.1 GC 日志分析

```bash
# JDK 8 GC 日志参数
-XX:+PrintGCDetails
-XX:+PrintGCDateStamps
-XX:+PrintGCTimeStamps
-Xloggc:/path/to/gc.log

# JDK 9+ 统一日志
-Xlog:gc*:file=/path/to/gc.log:time,uptime,level,tags

# GC 日志示例（G1）
[2024-01-01T10:00:00.000+0800][GC pause (G1 Evacuation Pause) (young), 0.0234 secs]
   [Parallel Time: 20.1 ms, GC Workers: 8]
   [Eden: 512.0M(512.0M)->0.0B(512.0M) Survivors: 64.0M->64.0M Heap: 1024.0M(4096.0M)->512.0M(4096.0M)]
```

### 6.2 常见调优参数

```bash
# 堆大小（建议初始=最大，避免动态扩容）
-Xms4g -Xmx4g

# 新生代大小
-Xmn1g                          # 固定新生代大小
-XX:NewRatio=2                  # 老年代:新生代 = 2:1

# Survivor 比例
-XX:SurvivorRatio=8             # Eden:S0:S1 = 8:1:1

# 晋升老年代年龄
-XX:MaxTenuringThreshold=15

# 元空间
-XX:MetaspaceSize=256m          # 初始元空间大小
-XX:MaxMetaspaceSize=512m       # 最大元空间大小

# GC 线程数
-XX:ParallelGCThreads=8         # STW 阶段并行线程数
-XX:ConcGCThreads=2             # 并发阶段线程数（G1/ZGC）
```

### 6.3 调优案例

**案例：频繁 Full GC**

```bash
# 排查步骤
1. jstat -gcutil <pid> 1000  # 每秒打印 GC 统计
   S0     S1     E      O      M     CCS    YGC     YGCT    FGC    FGCT     GCT
   0.00  99.00  50.00  95.00  95.00  90.00    100    2.000    10    5.000    7.000

2. 分析：老年代占用 95%，频繁 Full GC
   可能原因：
   a. 内存泄漏（对象无法被回收）
   b. 大对象直接进老年代
   c. 新生代太小，对象过早晋升

3. 解决：
   a. jmap -histo:live <pid> | head -20  # 查看存活对象分布
   b. jmap -dump:format=b,file=heap.hprof <pid>  # 导出堆快照
   c. MAT 分析 heap.hprof，找到内存泄漏点
```

---

## 7. OOM 排查与内存泄漏定位

### 7.1 OOM 类型

| OOM 类型 | 原因 | 解决 |
|----------|------|------|
| `Java heap space` | 堆内存不足 | 增大堆/修复内存泄漏 |
| `GC overhead limit exceeded` | GC 时间 > 98%，回收 < 2% | 同上 |
| `Metaspace` | 元空间不足（类太多） | 增大 MaxMetaspaceSize/检查动态代理 |
| `unable to create new native thread` | 线程数超限 | 减少线程数/增大系统限制 |
| `Direct buffer memory` | 直接内存不足 | 增大 `-XX:MaxDirectMemorySize` |

### 7.2 排查工具

```bash
# jmap：内存分析
jmap -heap <pid>                          # 堆概况
jmap -histo:live <pid> | head -30        # 存活对象统计
jmap -dump:format=b,file=heap.hprof <pid> # 导出堆快照

# jstack：线程分析
jstack <pid>                              # 线程 dump
jstack -l <pid>                           # 包含锁信息

# jstat：GC 统计
jstat -gcutil <pid> 1000 10              # 每秒打印，共10次
jstat -gccause <pid>                      # 显示 GC 原因

# Arthas：在线诊断（推荐）
java -jar arthas-boot.jar <pid>
dashboard                                 # 实时监控
heapdump /tmp/heap.hprof                 # 导出堆快照
memory                                    # 内存详情
thread -b                                 # 找阻塞线程
```

### 7.3 内存泄漏常见场景

```java
// 场景1：静态集合持有对象引用
static List<Object> cache = new ArrayList<>();
// 对象加入 cache 后永远不会被 GC

// 场景2：ThreadLocal 未清理
ThreadLocal<LargeObject> tl = new ThreadLocal<>();
tl.set(new LargeObject());
// 线程池中线程复用，ThreadLocal 不清理导致泄漏
// 正确：finally 块中 tl.remove()

// 场景3：监听器/回调未注销
eventBus.register(listener);
// 对象销毁时未调用 eventBus.unregister(listener)

// 场景4：内部类持有外部类引用
class Outer {
    class Inner {
        // 隐式持有 Outer.this 引用
    }
}
// 解决：使用静态内部类

// 场景5：连接/流未关闭
Connection conn = dataSource.getConnection();
// 未在 finally 中关闭，连接泄漏
```

---

## 8. JVM 性能监控工具

### 8.1 Arthas 常用命令

```bash
# 启动
java -jar arthas-boot.jar

# 实时监控
dashboard          # CPU、内存、线程概览
thread             # 线程列表
thread <id>        # 线程详情
thread -b          # 找阻塞线程

# 类/方法分析
sc com.example.*   # 搜索类
sm com.example.UserService  # 搜索方法
jad com.example.UserService # 反编译

# 方法追踪
trace com.example.UserService getUserById  # 追踪方法调用链路和耗时
watch com.example.UserService getUserById "{params,returnObj,throwExp}" -x 3  # 观察入参/返回值
monitor com.example.UserService getUserById -c 5  # 每5秒统计调用次数/成功率/耗时

# 内存分析
heapdump /tmp/heap.hprof
memory

# 火焰图（性能分析）
profiler start
profiler stop --format html
```

### 8.2 MAT（Memory Analyzer Tool）分析

```
分析步骤：
1. 导入 heap.hprof
2. 查看 Leak Suspects Report（内存泄漏嫌疑报告）
3. 分析 Dominator Tree（支配树，找占用内存最多的对象）
4. 查看 Retained Heap（对象及其引用链占用的总内存）
5. 使用 OQL 查询特定对象：
   SELECT * FROM java.util.ArrayList WHERE size > 10000
```

---

## 高频面试真题

### Q1：JVM 内存区域有哪些？各自的作用？

**答题框架**：
- 线程共享：堆（对象实例）、方法区/元空间（类信息、常量池）
- 线程私有：程序计数器（字节码行号）、虚拟机栈（方法调用栈帧）、本地方法栈（native 方法）
- JDK 8 变化：永久代 → 元空间（使用本地内存，避免 PermGen OOM）

### Q2：双亲委派模型的原理和破坏场景？

**答题框架**：
- 原理：子加载器先委派给父加载器，父加载器无法加载才由子加载器加载
- 好处：避免重复加载，保护核心类库
- 破坏场景：JDBC SPI（线程上下文类加载器）、OSGi（模块化）、热部署（Tomcat）、JDK 9 模块化

### Q3：G1 和 CMS 的区别？什么时候选 G1？

**答题框架**：
- CMS：老年代并发收集，标记-清除，有碎片，停顿短但不可预测
- G1：全堆 Region 化，标记-整理，无碎片，可设置停顿目标
- 选 G1：堆 > 4GB、需要可预测停顿时间、CMS 碎片问题严重
- 选 ZGC：需要 < 10ms 停顿、超大堆（TB 级）

### Q4：如何排查 OOM 问题？

**答题框架**：
- 添加 JVM 参数：`-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/tmp/`
- 使用 jmap 导出堆快照（如果还未 OOM）
- MAT 分析：Leak Suspects Report → Dominator Tree → 找到泄漏对象
- 常见原因：静态集合、ThreadLocal 未清理、监听器未注销、连接未关闭

### Q5：什么是 STW？如何减少 STW 时间？

**答题框架**：
- STW（Stop The World）：GC 时暂停所有用户线程，保证 GC 期间对象引用关系不变
- 减少 STW：使用 G1（可设置目标停顿时间）、ZGC（< 10ms）；合理设置堆大小；避免大对象；减少 Full GC
- 监控：GC 日志中 `pause` 时间；Arthas `dashboard` 观察 GC 频率

---

## 学习建议

**备考重点**：JVM 内存区域（必考）、类加载双亲委派（必考）、G1 原理（必考）、OOM 排查（必考）、Arthas 使用（加分项）

**推荐资源**：
- 《深入理解 Java 虚拟机》第 3 版（周志明）—— JVM 圣经
- OpenJDK 源码：`hotspot/src/share/vm/gc`
- Arthas 官方文档：https://arthas.aliyun.com/
- GC 日志分析工具：GCEasy（https://gceasy.io/）
