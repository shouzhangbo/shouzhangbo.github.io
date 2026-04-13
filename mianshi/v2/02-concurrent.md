# 模块二：Java 并发编程 ⭐

> 高频考点，P6/P7 必须深度掌握底层原理

---

## 1. JMM 内存模型

### 1.1 核心概念

Java 内存模型（JMM）定义了多线程程序中**共享变量的访问规则**，屏蔽了不同硬件和操作系统的内存访问差异。

**三大特性**：
- **可见性**：一个线程修改共享变量后，其他线程能立即看到最新值
- **有序性**：程序执行顺序按照代码顺序（禁止指令重排）
- **原子性**：操作不可被中断，要么全部执行，要么不执行

**主内存 vs 工作内存**：

```
主内存（Main Memory）
    ↕ read/write
工作内存（Working Memory）= CPU 缓存 + 寄存器
    ↕ use/assign/load/store
线程执行引擎
```

### 1.2 happens-before 规则 ⭐

happens-before 是 JMM 对程序员的承诺：如果操作 A happens-before 操作 B，则 A 的结果对 B 可见。

**8 条规则**：

| 规则 | 说明 |
|------|------|
| 程序顺序规则 | 同一线程内，前面的操作 hb 后面的操作 |
| volatile 规则 | volatile 写 hb 后续的 volatile 读 |
| 监视器锁规则 | unlock hb 后续对同一锁的 lock |
| 传递性规则 | A hb B，B hb C，则 A hb C |
| 线程启动规则 | `Thread.start()` hb 线程内所有操作 |
| 线程终止规则 | 线程所有操作 hb `Thread.join()` 返回 |
| 线程中断规则 | `interrupt()` hb 检测到中断 |
| 对象终结规则 | 构造函数结束 hb `finalize()` 开始 |

```java
// happens-before 实战示例
int x = 0;
volatile boolean flag = false;

// 线程 A
x = 42;           // 操作1
flag = true;      // 操作2（volatile 写）

// 线程 B
if (flag) {       // 操作3（volatile 读）
    // 由于 volatile 规则：操作2 hb 操作3
    // 由于程序顺序规则：操作1 hb 操作2
    // 由于传递性：操作1 hb 操作3
    System.out.println(x);  // 一定能看到 x=42
}
```

### 1.3 指令重排序

```java
// 经典双重检查锁（DCL）问题
public class Singleton {
    // 没有 volatile：可能发生指令重排
    private static Singleton instance;
    
    public static Singleton getInstance() {
        if (instance == null) {
            synchronized (Singleton.class) {
                if (instance == null) {
                    instance = new Singleton();
                    // 对象创建分三步：
                    // 1. 分配内存
                    // 2. 初始化对象
                    // 3. 将引用指向内存
                    // 步骤2和3可能重排，导致其他线程看到未初始化的对象
                }
            }
        }
        return instance;
    }
}

// 正确写法：加 volatile 禁止重排
private static volatile Singleton instance;
```

---

## 2. synchronized 底层原理 ⭐

### 2.1 对象头结构

每个 Java 对象都有一个**对象头（Object Header）**，包含：

```
对象头（64位JVM）
├── Mark Word（8字节）：存储锁状态、GC信息、哈希码
└── Klass Pointer（4字节，开启压缩指针）：指向类元数据
```

**Mark Word 状态变化**：

| 锁状态 | Mark Word 内容 |
|--------|---------------|
| 无锁 | hashCode(25) + age(4) + biased_lock(1)=0 + lock(2)=01 |
| 偏向锁 | threadId(54) + epoch(2) + age(4) + biased_lock(1)=1 + lock(2)=01 |
| 轻量级锁 | 指向栈中锁记录的指针(62) + lock(2)=00 |
| 重量级锁 | 指向 monitor 的指针(62) + lock(2)=10 |
| GC 标记 | lock(2)=11 |

### 2.2 锁升级过程 ⭐

```
无锁 → 偏向锁 → 轻量级锁 → 重量级锁（单向升级，不可降级）
```

**偏向锁**：
- 适用场景：只有一个线程访问同步块
- 原理：将线程 ID 记录在 Mark Word，下次同一线程进入无需 CAS
- JDK 15 后默认禁用（`-XX:+UseBiasedLocking`）

**轻量级锁**：
- 适用场景：多线程交替访问（无竞争）
- 原理：CAS 将 Mark Word 替换为指向栈帧中锁记录的指针
- 自旋等待：默认自旋 10 次（`-XX:PreBlockSpin`）

**重量级锁**：
- 适用场景：多线程同时竞争
- 原理：依赖 OS 的 Mutex Lock，线程阻塞/唤醒需要内核态切换

```java
// synchronized 字节码
public void method() {
    synchronized (this) {
        // ...
    }
}
// 编译后：monitorenter / monitorexit 指令
// monitorenter：尝试获取 monitor，计数器+1
// monitorexit：释放 monitor，计数器-1，为0时释放
```

### 2.3 Monitor 结构

```
ObjectMonitor
├── _owner：持有锁的线程
├── _count：重入次数
├── _EntryList：等待锁的线程队列（BLOCKED 状态）
├── _WaitSet：调用 wait() 的线程队列（WAITING 状态）
└── _cxq：竞争队列（新来的线程先进 cxq）
```

---

## 3. volatile 原理与使用场景

### 3.1 底层实现

volatile 通过**内存屏障（Memory Barrier）**实现：

```
volatile 写：
    StoreStore 屏障（前）
    volatile 写操作
    StoreLoad 屏障（后）

volatile 读：
    volatile 读操作
    LoadLoad 屏障（后）
    LoadStore 屏障（后）
```

在 x86 架构上，volatile 写会生成 `lock` 前缀指令，相当于全屏障。

### 3.2 使用场景

```java
// 场景1：状态标志（单次写入，多次读取）
volatile boolean running = true;

void stop() { running = false; }
void run() {
    while (running) { /* ... */ }
}

// 场景2：双重检查锁（DCL）
private volatile static Singleton instance;

// 场景3：独立观察（发布最新值）
volatile int temperature;  // 传感器数据，只有一个写线程

// 不适合场景：复合操作（i++ 不是原子的）
volatile int count = 0;
count++;  // 读-改-写，非原子，需要用 AtomicInteger
```

### 3.3 volatile vs synchronized

| 维度 | volatile | synchronized |
|------|----------|-------------|
| 原子性 | 不保证（单次读写保证） | 保证 |
| 可见性 | 保证 | 保证 |
| 有序性 | 保证（禁止重排） | 保证 |
| 阻塞 | 不阻塞 | 可能阻塞 |
| 性能 | 轻量 | 相对重量 |
| 适用场景 | 状态标志、DCL | 复合操作、临界区 |

---

## 4. AQS 框架源码分析 ⭐

### 4.1 AQS 核心结构

`AbstractQueuedSynchronizer` 是 Java 并发包的基础框架，`ReentrantLock`、`Semaphore`、`CountDownLatch` 等都基于它实现。

```java
public abstract class AbstractQueuedSynchronizer {
    // 同步状态（核心变量）
    private volatile int state;
    
    // CLH 变体队列（双向链表）
    private transient volatile Node head;
    private transient volatile Node tail;
    
    // 独占模式：子类实现
    protected boolean tryAcquire(int arg) { throw new UnsupportedOperationException(); }
    protected boolean tryRelease(int arg) { throw new UnsupportedOperationException(); }
    
    // 共享模式：子类实现
    protected int tryAcquireShared(int arg) { throw new UnsupportedOperationException(); }
    protected boolean tryReleaseShared(int arg) { throw new UnsupportedOperationException(); }
}
```

### 4.2 独占锁获取流程

```java
// acquire 流程（以 ReentrantLock 为例）
public final void acquire(int arg) {
    if (!tryAcquire(arg) &&           // 1. 尝试获取锁（子类实现）
        acquireQueued(addWaiter(Node.EXCLUSIVE), arg))  // 2. 失败则入队等待
        selfInterrupt();
}

// addWaiter：将当前线程封装为 Node 加入队尾（CAS）
// acquireQueued：自旋等待，前驱节点为 head 时尝试获取锁
final boolean acquireQueued(final Node node, int arg) {
    for (;;) {
        final Node p = node.predecessor();
        if (p == head && tryAcquire(arg)) {  // 前驱是 head，尝试获取
            setHead(node);
            p.next = null;  // GC
            return false;
        }
        if (shouldParkAfterFailedAcquire(p, node))
            parkAndCheckInterrupt();  // LockSupport.park() 挂起线程
    }
}
```

### 4.3 Condition 等待/通知

```java
ReentrantLock lock = new ReentrantLock();
Condition notEmpty = lock.newCondition();
Condition notFull = lock.newCondition();

// 生产者
lock.lock();
try {
    while (queue.isFull()) {
        notFull.await();  // 释放锁，进入 ConditionObject 的等待队列
    }
    queue.add(item);
    notEmpty.signal();  // 唤醒消费者
} finally {
    lock.unlock();
}
```

---

## 5. ReentrantLock / ReadWriteLock / StampedLock

### 5.1 ReentrantLock

```java
ReentrantLock lock = new ReentrantLock(true);  // true=公平锁

// 可中断获取锁
lock.lockInterruptibly();

// 超时获取锁
if (lock.tryLock(3, TimeUnit.SECONDS)) {
    try {
        // ...
    } finally {
        lock.unlock();
    }
}
```

**公平锁 vs 非公平锁**：

| 维度 | 公平锁 | 非公平锁 |
|------|--------|----------|
| 获取顺序 | 严格按等待顺序 | 允许插队 |
| 吞吐量 | 低（线程切换多） | 高（减少线程切换） |
| 饥饿 | 不会 | 可能 |
| 默认 | 否 | 是 |

### 5.2 ReadWriteLock

```java
ReadWriteLock rwLock = new ReentrantReadWriteLock();
Lock readLock = rwLock.readLock();
Lock writeLock = rwLock.writeLock();

// 读多写少场景
public String read(String key) {
    readLock.lock();
    try {
        return cache.get(key);  // 多个读线程可并发
    } finally {
        readLock.unlock();
    }
}

public void write(String key, String value) {
    writeLock.lock();
    try {
        cache.put(key, value);  // 写时独占
    } finally {
        writeLock.unlock();
    }
}
```

**注意**：读写锁不支持锁升级（读锁升级为写锁会死锁），但支持锁降级（写锁降级为读锁）。

### 5.3 StampedLock ⭐

```java
StampedLock sl = new StampedLock();

// 乐观读（不加锁，适合读多写少）
public double distanceFromOrigin() {
    long stamp = sl.tryOptimisticRead();  // 获取乐观读戳
    double x = this.x, y = this.y;
    if (!sl.validate(stamp)) {  // 检查是否有写操作
        stamp = sl.readLock();  // 升级为悲观读锁
        try {
            x = this.x;
            y = this.y;
        } finally {
            sl.unlockRead(stamp);
        }
    }
    return Math.sqrt(x * x + y * y);
}
```

**三种锁对比**：

| 特性 | ReentrantLock | ReadWriteLock | StampedLock |
|------|--------------|---------------|-------------|
| 可重入 | 是 | 是 | 否 |
| 公平锁 | 支持 | 支持 | 不支持 |
| 乐观读 | 否 | 否 | 是 |
| 锁升级 | - | 不支持 | 支持 |
| 性能 | 中 | 读并发高 | 最高 |

---

## 6. 线程池 ThreadPoolExecutor ⭐

### 6.1 核心参数

```java
ThreadPoolExecutor executor = new ThreadPoolExecutor(
    4,                              // corePoolSize：核心线程数
    8,                              // maximumPoolSize：最大线程数
    60L,                            // keepAliveTime：空闲线程存活时间
    TimeUnit.SECONDS,               // 时间单位
    new LinkedBlockingQueue<>(1000), // workQueue：任务队列
    new ThreadFactoryBuilder()       // threadFactory：线程工厂
        .setNameFormat("order-pool-%d")
        .build(),
    new ThreadPoolExecutor.CallerRunsPolicy()  // handler：拒绝策略
);
```

### 6.2 任务提交流程 ⭐

```
提交任务
    ↓
当前线程数 < corePoolSize？
    是 → 创建核心线程执行
    否 ↓
队列未满？
    是 → 加入队列等待
    否 ↓
当前线程数 < maximumPoolSize？
    是 → 创建非核心线程执行
    否 → 执行拒绝策略
```

### 6.3 四种拒绝策略

| 策略 | 行为 | 适用场景 |
|------|------|----------|
| `AbortPolicy`（默认） | 抛出 `RejectedExecutionException` | 需要感知拒绝的场景 |
| `CallerRunsPolicy` | 由提交任务的线程执行 | 不允许丢失任务，可接受降速 |
| `DiscardPolicy` | 静默丢弃新任务 | 允许丢失，不关心结果 |
| `DiscardOldestPolicy` | 丢弃队列最老任务，重试提交 | 新任务优先级更高 |

### 6.4 线程池调优实战

```java
// CPU 密集型：线程数 = CPU 核数 + 1
int cpuCores = Runtime.getRuntime().availableProcessors();
int cpuBoundPoolSize = cpuCores + 1;

// IO 密集型：线程数 = CPU 核数 * (1 + 等待时间/计算时间)
// 经验值：CPU 核数 * 2
int ioBoundPoolSize = cpuCores * 2;

// 监控线程池状态
executor.getPoolSize();          // 当前线程数
executor.getActiveCount();       // 活跃线程数
executor.getQueue().size();      // 队列中任务数
executor.getCompletedTaskCount(); // 已完成任务数
```

**常见坑点**：

```java
// 坑1：Executors.newFixedThreadPool 使用无界队列，可能 OOM
ExecutorService pool = Executors.newFixedThreadPool(10);
// 底层：new LinkedBlockingQueue<>()，无界！

// 坑2：Executors.newCachedThreadPool 无限创建线程，可能 OOM
ExecutorService pool = Executors.newCachedThreadPool();
// 底层：maximumPoolSize = Integer.MAX_VALUE

// 正确做法：手动创建 ThreadPoolExecutor，明确所有参数
```

---

## 7. CAS 与原子类

### 7.1 CAS 原理

CAS（Compare And Swap）是一种**无锁算法**，通过 CPU 原子指令（`cmpxchg`）实现：

```java
// CAS 语义
boolean compareAndSwap(V expectedValue, V newValue) {
    if (current == expectedValue) {
        current = newValue;
        return true;
    }
    return false;
}

// AtomicInteger 实现
public final int incrementAndGet() {
    return unsafe.getAndAddInt(this, valueOffset, 1) + 1;
}
// Unsafe.getAndAddInt 底层调用 CPU 的 lock cmpxchg 指令
```

### 7.2 ABA 问题

```java
// ABA 问题：A→B→A，CAS 认为没有变化，但实际已经改变
// 解决：使用版本号
AtomicStampedReference<Integer> ref = 
    new AtomicStampedReference<>(100, 0);

int[] stampHolder = new int[1];
Integer value = ref.get(stampHolder);
int stamp = stampHolder[0];

// CAS 时同时检查版本号
ref.compareAndSet(value, newValue, stamp, stamp + 1);
```

### 7.3 原子类体系

```java
// 基本类型
AtomicInteger, AtomicLong, AtomicBoolean

// 引用类型
AtomicReference<V>
AtomicStampedReference<V>   // 解决 ABA
AtomicMarkableReference<V>  // 标记引用

// 数组类型
AtomicIntegerArray, AtomicLongArray

// 字段更新器（减少对象创建）
AtomicIntegerFieldUpdater<User> updater = 
    AtomicIntegerFieldUpdater.newUpdater(User.class, "age");
updater.incrementAndGet(user);

// Java 8 高性能累加器（高并发下比 AtomicLong 性能好）
LongAdder adder = new LongAdder();
adder.increment();
long sum = adder.sum();
// 原理：分段累加，减少 CAS 竞争，最终汇总
```

---

## 8. 并发容器

### 8.1 ConcurrentHashMap ⭐

**JDK 7（分段锁）**：
- 将 HashMap 分为 16 个 Segment，每个 Segment 是一个 ReentrantLock
- 并发度 = Segment 数量（默认 16）

**JDK 8（CAS + synchronized）**：

```java
// JDK 8 核心结构：Node 数组 + 链表/红黑树
// 关键操作：
// 1. 初始化：CAS 设置 sizeCtl，只有一个线程初始化
// 2. put：
//    - 桶为空：CAS 插入
//    - 桶不为空：synchronized 锁住桶头节点
//    - 链表长度 >= 8：转红黑树
// 3. 扩容：多线程协助扩容（transfer），每个线程负责一段桶

// size() 计算：baseCount + CounterCell[] 分段计数（类似 LongAdder）
```

**JDK 7 vs JDK 8 对比**：

| 维度 | JDK 7 | JDK 8 |
|------|-------|-------|
| 锁粒度 | Segment（16个） | 桶头节点 |
| 锁类型 | ReentrantLock | synchronized |
| 数据结构 | 数组+链表 | 数组+链表+红黑树 |
| 并发度 | 固定16 | 桶数量（更细粒度） |

### 8.2 CopyOnWriteArrayList

```java
// 写时复制：写操作时复制整个数组，写完替换引用
// 读操作无锁，适合读多写少场景
CopyOnWriteArrayList<String> list = new CopyOnWriteArrayList<>();

// 底层 add 实现
public boolean add(E e) {
    synchronized (lock) {
        Object[] elements = getArray();
        int len = elements.length;
        Object[] newElements = Arrays.copyOf(elements, len + 1);  // 复制
        newElements[len] = e;
        setArray(newElements);  // 替换引用
        return true;
    }
}
```

**注意**：CopyOnWriteArrayList 存在**弱一致性**，迭代器遍历的是快照，不反映最新修改。

---

## 9. CompletableFuture 异步编程

### 9.1 核心 API

```java
// 创建异步任务
CompletableFuture<String> future = CompletableFuture.supplyAsync(
    () -> fetchFromDB(),
    executor  // 指定线程池，不指定则用 ForkJoinPool.commonPool()
);

// 链式处理
CompletableFuture<String> result = future
    .thenApply(data -> process(data))           // 同步转换
    .thenApplyAsync(data -> transform(data))    // 异步转换
    .thenCompose(data -> fetchMore(data))       // 扁平化（避免嵌套）
    .exceptionally(e -> "默认值")               // 异常处理
    .whenComplete((v, e) -> log(v, e));         // 完成回调（无论成功失败）

// 组合多个 Future
CompletableFuture<Void> all = CompletableFuture.allOf(f1, f2, f3);
CompletableFuture<Object> any = CompletableFuture.anyOf(f1, f2, f3);

// 两个 Future 组合
CompletableFuture<String> combined = f1.thenCombine(f2, 
    (r1, r2) -> r1 + r2);
```

### 9.2 实战：并行查询

```java
// 并行查询用户信息、订单信息、积分信息
public UserDetailVO getUserDetail(Long userId) {
    CompletableFuture<User> userFuture = 
        CompletableFuture.supplyAsync(() -> userService.getUser(userId), executor);
    
    CompletableFuture<List<Order>> orderFuture = 
        CompletableFuture.supplyAsync(() -> orderService.getOrders(userId), executor);
    
    CompletableFuture<Integer> pointFuture = 
        CompletableFuture.supplyAsync(() -> pointService.getPoints(userId), executor);
    
    // 等待所有完成
    CompletableFuture.allOf(userFuture, orderFuture, pointFuture).join();
    
    return UserDetailVO.builder()
        .user(userFuture.join())
        .orders(orderFuture.join())
        .points(pointFuture.join())
        .build();
}
```

---

## 10. 死锁排查与预防

### 10.1 死锁四个必要条件

1. **互斥**：资源同时只能被一个线程持有
2. **持有并等待**：线程持有资源的同时等待其他资源
3. **不可剥夺**：资源只能由持有者主动释放
4. **循环等待**：线程间形成循环等待链

### 10.2 死锁排查

```bash
# 1. 获取线程 dump
jstack <pid> > thread_dump.txt

# 2. 查找死锁信息
grep -A 20 "deadlock" thread_dump.txt

# 3. Arthas 在线诊断
thread -b  # 找出阻塞其他线程的线程
```

**jstack 输出示例**：
```
Found one Java-level deadlock:
=============================
"Thread-1":
  waiting to lock monitor 0x... (object 0x..., a java.lang.Object),
  which is held by "Thread-0"
"Thread-0":
  waiting to lock monitor 0x... (object 0x..., a java.lang.Object),
  which is held by "Thread-1"
```

### 10.3 死锁预防

```java
// 方案1：固定加锁顺序
// 错误：线程A先锁a再锁b，线程B先锁b再锁a
// 正确：所有线程按相同顺序加锁

// 方案2：超时获取锁
if (lock1.tryLock(1, TimeUnit.SECONDS)) {
    try {
        if (lock2.tryLock(1, TimeUnit.SECONDS)) {
            try {
                // 业务逻辑
            } finally {
                lock2.unlock();
            }
        }
    } finally {
        lock1.unlock();
    }
}

// 方案3：使用 tryLock 避免死等
// 方案4：减少锁的粒度，缩短持锁时间
// 方案5：使用无锁数据结构（ConcurrentHashMap 等）
```

---

## 高频面试真题

### Q1：synchronized 的锁升级过程是什么？

**答题框架**：
- 无锁 → 偏向锁（单线程，Mark Word 记录线程ID）→ 轻量级锁（多线程交替，CAS 自旋）→ 重量级锁（多线程竞争，OS Mutex）
- 升级触发条件：偏向锁遇到竞争升级为轻量级锁；轻量级锁自旋超过阈值（默认10次）或等待线程数超过 CPU 核数一半时升级为重量级锁
- JDK 15 后偏向锁默认禁用（维护成本高，现代应用启动时竞争激烈）

### Q2：AQS 的核心原理是什么？

**答题框架**：
- 核心：volatile int state + CLH 变体队列（双向链表）
- 独占模式：tryAcquire 失败则 addWaiter 入队，acquireQueued 自旋等待（前驱为 head 时尝试获取）
- 共享模式：tryAcquireShared 返回负数则入队，返回非负数则传播唤醒
- Condition：ConditionObject 维护等待队列，await 释放锁并入队，signal 将节点从等待队列转移到同步队列

### Q3：线程池的核心参数如何配置？

**答题框架**：
- CPU 密集型：核心线程数 = CPU 核数 + 1（+1 防止偶发停顿）
- IO 密集型：核心线程数 = CPU 核数 * 2（或根据等待比例计算）
- 队列选择：有界队列（LinkedBlockingQueue 指定容量）防止 OOM
- 拒绝策略：CallerRunsPolicy 适合不允许丢失的场景
- 监控：定期打印 poolSize/activeCount/queueSize/completedTaskCount

### Q4：ConcurrentHashMap 在 JDK 8 中如何实现线程安全？

**答题框架**：
- 初始化：CAS 设置 sizeCtl，保证只有一个线程初始化
- put：桶为空时 CAS 插入；桶不为空时 synchronized 锁住桶头节点
- 扩容：多线程协助扩容，每个线程负责一段桶的迁移
- size：baseCount + CounterCell 分段计数，类似 LongAdder，减少 CAS 竞争

### Q5：如何排查生产环境的死锁问题？

**答题框架**：
- 发现：监控线程数异常增长、接口响应超时
- 排查：`jstack <pid>` 获取线程 dump，搜索 "deadlock" 关键字；或使用 Arthas `thread -b`
- 分析：找到循环等待的线程链，确定锁对象和代码位置
- 解决：固定加锁顺序、使用 tryLock 超时、减少锁粒度
- 预防：代码 review 时关注多锁场景，使用 FindBugs/SpotBugs 静态分析

---

## 学习建议

**备考重点**：JMM happens-before（必考）、synchronized 锁升级（必考）、AQS 源码（必考）、线程池参数（必考）、ConcurrentHashMap JDK8 实现（必考）

**推荐资源**：
- 《Java 并发编程实战》（Brian Goetz）
- 《Java 并发编程的艺术》（方腾飞）
- OpenJDK 源码：`java.util.concurrent.locks.AbstractQueuedSynchronizer`
- Doug Lea 的 AQS 论文：《The java.util.concurrent Synchronizer Framework》
