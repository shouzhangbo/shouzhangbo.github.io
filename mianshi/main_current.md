## 2. 并发编程

### 2.1 Java内存模型（JMM）
- **内存模型抽象**：主内存（所有线程共享）、工作内存（每个线程私有，存储变量副本）。
- **内存间交互操作**：lock、unlock、read、load、use、assign、store、write八种原子操作及规则。
- **重排序**：编译器重排序、处理器重排序，as-if-serial语义。
- **happens-before规则**：程序顺序规则、volatile变量规则、锁规则、传递性等，定义可见性与有序性。
- **volatile的内存语义**：写volatile变量时立即刷新到主内存，读volatile变量时从主内存读取，禁止指令重排序（内存屏障实现）。
- **内存屏障**：LoadLoad、StoreStore、LoadStore、StoreStore屏障的作用与插入策略。
- **顺序一致性**：JMM对正确同步程序的顺序一致性保证。

### 2.2 线程基础
- **线程的生命周期**：新建（NEW）、就绪（RUNNABLE）、阻塞（BLOCKED）、等待（WAITING）、超时等待（TIMED_WAITING）、终止（TERMINATED），状态转换图。
- **创建线程的方式**：继承Thread、实现Runnable、实现Callable结合FutureTask、线程池。
- **线程常用方法**：sleep、yield、join、interrupt（中断机制）、isInterrupted、interrupted。
- **守护线程**：setDaemon，与用户线程的区别，垃圾回收线程等。

### 2.3 线程池
- **ThreadPoolExecutor核心参数**：corePoolSize、maximumPoolSize、keepAliveTime、unit、workQueue、threadFactory、handler。
- **工作队列**：ArrayBlockingQueue、LinkedBlockingQueue、SynchronousQueue、PriorityBlockingQueue、DelayQueue。
- **拒绝策略**：AbortPolicy（默认抛出异常）、CallerRunsPolicy（调用者线程执行）、DiscardPolicy（静默丢弃）、DiscardOldestPolicy（丢弃队列头任务）。
- **常用线程池**：FixedThreadPool、CachedThreadPool、ScheduledThreadPool、SingleThreadExecutor、WorkStealingPool（ForkJoinPool）的源码实现与适用场景。
- **线程池监控与动态调整**：获取当前线程数、活跃线程数、已完成任务数，通过setCorePoolSize动态调整核心线程数。
- **正确关闭线程池**：shutdown（不再接受新任务，等待已提交任务完成）、shutdownNow（尝试停止正在执行的任务，返回等待执行的任务列表），awaitTermination等待终止。

### 2.4 锁机制
- **synchronized**：
  - 使用方法：修饰实例方法（锁当前实例）、静态方法（锁Class对象）、代码块（指定锁对象）。
  - 原理：对象头Mark Word（锁状态、偏向线程ID等）、Monitor（ObjectMonitor），字节码层面monitorenter/monitorexit。
  - 锁升级过程：无锁 → 偏向锁 → 轻量级锁（自旋锁） → 重量级锁（互斥锁），以及锁降级（GC时发生）。
- **Lock接口**：
  - ReentrantLock：可重入性，公平/非公平锁的实现（AQS），tryLock支持超时，lockInterruptibly支持响应中断。
  - ReentrantReadWriteLock：读写锁分离，读锁共享（共享模式），写锁独占，适用于读多写少场景。
  - StampedLock：JDK 8引入，支持乐观读、悲观读、写锁，避免写线程饥饿。
- **AQS（AbstractQueuedSynchronizer）**：
  - 核心结构：volatile int state（同步状态），CLH变体队列（双向链表，Node包含线程、等待状态）。
  - 独占模式（如ReentrantLock）：acquire、release流程，tryAcquire由子类实现，节点入队、自旋、阻塞、唤醒。
  - 共享模式（如Semaphore、CountDownLatch）：acquireShared、releaseShared，doAcquireShared等。
  - 条件队列（ConditionObject）：await、signal的实现，与同步队列的协作。
- **Condition**：与Lock搭配，实现等待/通知机制，类似Object的wait/notify，但可绑定多个条件队列。
- **锁优化**：
  - 锁消除（JIT逃逸分析）、锁粗化（相邻同步块合并）。
  - 减少锁持有时间，减小锁粒度（如ConcurrentHashMap分段锁），读写分离。
  - 避免死锁：锁顺序、锁超时、死锁检测（jstack命令）。

### 2.5 并发工具类
- **CountDownLatch**：计数器，主线程等待所有子任务完成，不可重用。
- **CyclicBarrier**：屏障，所有线程到达屏障后继续执行，可重用（reset）。
- **Semaphore**：信号量，控制同时访问资源的线程数，可实现限流。
- **Exchanger**：两个线程交换数据，同步点交换。
- **Phaser**：JDK 7引入，可动态调整参与者，类似多阶段栅栏。
- **BlockingQueue**：
  - ArrayBlockingQueue：有界数组队列，内部一把锁两个条件。
  - LinkedBlockingQueue：基于链表，可选有界，两把锁（takeLock、putLock）。
  - SynchronousQueue：不存储元素，直接传递，支持公平/非公平。
  - PriorityBlockingQueue：优先级队列，无界，使用堆实现。
  - DelayQueue：延迟队列，元素需实现Delayed接口，用于定时任务。
- **ConcurrentHashMap**：
  - JDK 7：Segment分段锁，默认16段，每段类似HashMap。
  - JDK 8：摒弃分段锁，使用CAS + synchronized对每个桶的首节点加锁，引入红黑树优化长链表。
  - 重要方法：put、get、size（通过CounterCell累加）、transfer（扩容迁移）。
- **CopyOnWriteArrayList**：写时复制，适用于读多写少，迭代器弱一致性，内存开销大。
- **ConcurrentLinkedQueue**：无界非阻塞队列，CAS实现，无锁算法，适用于高并发。
- **LinkedTransferQueue**：JDK 7引入，TransferQueue接口，支持生产者等待消费者取走元素。
- **原子类**：
  - AtomicInteger、AtomicLong、AtomicReference、AtomicBoolean：基于Unsafe的CAS实现。
  - AtomicIntegerArray、AtomicReferenceArray：数组元素的原子更新。
  - LongAdder（JDK 8）：分段累加，减少CAS竞争，适合高并发统计，最终sum时累加各段值。
  - LongAccumulator：提供自定义函数累加。
- **CAS原理与ABA问题**：
  - Unsafe类提供的compareAndSwapXXX方法，直接操作内存。
  - ABA问题：变量被修改为A后又改回A，CAS误认为未变化。解决：AtomicStampedReference（版本号）、AtomicMarkableReference（布尔标记）。

### 2.6 volatile与final
- **volatile**（已在JMM中详述）：可见性、禁止重排序，不保证原子性（如i++）。
- **final**：不可变性，对基本类型保证初始化安全（构造方法结束后其他线程可见），对引用类型保证引用可见性但对象内部状态不一定。

### 2.7 ThreadLocal
- **原理**：每个线程维护ThreadLocalMap，键为ThreadLocal实例弱引用，值为线程局部变量。
- **内存泄漏分析**：ThreadLocalMap的key为弱引用，但value为强引用，若ThreadLocal被回收但线程存活，value无法被回收，需调用remove清理。
- **应用场景**：数据库连接管理、Session管理、请求上下文（如Spring的RequestContextHolder）、日期格式化对象线程安全。

### 2.8 Fork/Join框架
- **思想**：分治法，将大任务拆分为子任务，并行执行，结果合并。
- **核心类**：ForkJoinPool（工作窃取线程池）、ForkJoinTask（子任务，常用RecursiveTask有返回值，RecursiveAction无返回值）。
- **工作窃取算法**：空闲线程从其他线程的任务队列尾部窃取任务，减少竞争。
- **适用场景**：大规模计算、数组排序（如Arrays.parallelSort）、流式并行处理。

### 2.9 并发编程模型
- **生产者-消费者模式**：使用BlockingQueue实现解耦。
- **读写锁分离**：使用ReentrantReadWriteLock提高读并发。
- **并行流水线**：类似CPU流水线，每个阶段由一个线程处理，通过队列传递数据。
- **Fork/Join并行模型**：分治+工作窃取。
- **Actor模型**：Akka等，通过消息传递避免共享状态。

### 2.10 并发编程最佳实践与常见陷阱
- **最佳实践**：
  - 使用线程池管理线程，避免手动创建。
  - 优先使用并发容器而非同步容器（如ConcurrentHashMap替代Hashtable）。
  - 同步块尽量小，减少锁持有时间。
  - 避免在同步块中调用外部方法（可能导致死锁或性能下降）。
  - 使用不可变对象减少同步需求。
  - 正确使用ThreadLocal，用完及时remove防止内存泄漏。
  - 使用CountDownLatch/CyclicBarrier协调线程，替代复杂的wait/notify。
  - 使用LongAdder替代AtomicLong用于统计计数。
  - 警惕伪共享（False Sharing），通过@Contended注解或缓存行填充解决。
- **常见陷阱**：
  - HashMap并发死循环（JDK 7扩容时头插法导致），使用ConcurrentHashMap。
  - 死锁：嵌套锁、锁顺序不一致、动态锁顺序（如转账），通过锁顺序、tryLock超时避免。
  - 活锁：线程不断重试但无法成功，可通过随机退避解决。
  - 线程饥饿：低优先级线程始终得不到执行，读写锁中写线程饥饿（StampedLock解决）。
  - 并发下i++原子性问题：需使用AtomicInteger或synchronized。
  - 使用volatile但不保证复合操作原子性。
  - ThreadLocal误用导致数据错乱（如线程池中线程复用，未清理）。
  - 发布对象溢出：构造期间this引用逸出。
  - 对共享变量未正确同步导致可见性问题。