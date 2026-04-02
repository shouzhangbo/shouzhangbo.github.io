# Java并发编程核心面试题及答案


## 一、线程基础
### 1. 什么是线程？线程与进程的核心区别是什么？
**答案**：
- 线程是进程内的执行单元，是CPU调度的基本单位，一个进程可以包含多个线程，共享进程的资源（内存、文件句柄等）。
- 核心区别：  
  | 维度         | 进程                     | 线程                     |  
  |--------------|--------------------------|--------------------------|  
  | 资源分配     | 系统资源分配的基本单位   | 不独立分配资源，共享进程资源 |  
  | 上下文切换   | 开销大（需切换地址空间等） | 开销小（仅切换寄存器和栈） |  
  | 通信方式     | 需跨进程通信（如管道、Socket） | 可直接通过共享内存通信     |


### 2. 线程有哪些创建方式？各有什么优缺点？
**答案**：  
共4种创建方式：
1. **继承Thread类**：
    - 优点：实现简单，直接重写run()方法。
    - 缺点：Java单继承限制，无法再继承其他类；无法返回执行结果。

2. **实现Runnable接口**：
    - 优点：可多实现，避免单继承限制；适合多线程共享资源。
    - 缺点：无法返回执行结果，无异常抛出机制。

3. **实现Callable接口+FutureTask**：
    - 优点：可通过Future获取返回结果；支持抛出异常。
    - 缺点：实现较复杂，需配合FutureTask使用。

4. **线程池创建**：
    - 优点：复用线程，减少创建销毁开销；便于管理线程（如控制并发数）。
    - 缺点：需额外配置线程池参数。


### 3. 线程的生命周期包含哪些状态？状态之间如何转换？
**答案**：  
Java线程有6种状态（定义在`Thread.State`枚举中）：
1. **NEW**：线程创建后未启动（未调用start()）。
2. **RUNNABLE**：包含“就绪”（等待CPU调度）和“运行中”（正在执行run()）两种状态。
3. **BLOCKED**：等待获取同步锁（如进入synchronized块时未抢到锁）。
4. **WAITING**：无限期等待被唤醒（如调用wait()、join()、park()）。
5. **TIMED_WAITING**：限时等待（如调用sleep(1000)、wait(1000)）。
6. **TERMINATED**：线程执行完毕（run()方法结束）。

**状态转换**：
- NEW → RUNNABLE：调用start()方法。
- RUNNABLE → BLOCKED：争抢同步锁失败。
- BLOCKED → RUNNABLE：获取到同步锁。
- RUNNABLE → WAITING：调用无参wait()、join()等。
- WAITING → RUNNABLE：被notify()/notifyAll()唤醒或join的线程结束。
- RUNNABLE → TIMED_WAITING：调用带超时参数的sleep()、wait()等。
- TIMED_WAITING → RUNNABLE：超时时间到或被提前唤醒。
- RUNNABLE → TERMINATED：run()方法执行完毕。


### 4. 线程中断机制相关的方法有哪些？如何优雅中断线程？
**答案**：  
相关方法：
- `interrupt()`：给线程设置中断标记（不会立即中断线程）。
- `isInterrupted()`：判断当前线程的中断标记（不会清除标记）。
- `interrupted()`：静态方法，判断当前线程的中断标记（会清除标记）。

**优雅中断线程**：  
避免使用`stop()`（强制终止线程，可能导致资源未释放），推荐：
1. 线程内部定期检查`isInterrupted()`标记，若为true则主动退出。
2. 结合阻塞方法（如wait()、sleep()），这些方法会响应中断并抛出`InterruptedException`，在catch块中处理中断逻辑。

示例：
```java
Thread t = new Thread(() -> {
    while (!Thread.currentThread().isInterrupted()) {
        // 业务逻辑
        try {
            Thread.sleep(1000); // 阻塞方法会响应中断
        } catch (InterruptedException e) {
            // 清除中断标记，需重新设置以退出循环
            Thread.currentThread().interrupt();
        }
    }
});
t.start();
// 中断线程
t.interrupt();
```  


### 5. 线程间通信的方式有哪些？
**答案**：
1. **wait()/notify()/notifyAll()**：基于synchronized锁，线程通过共享对象的等待/通知机制通信（必须在同步块中调用）。
2. **join()**：让当前线程等待目标线程执行完毕（底层依赖wait()实现）。
3. **Thread.yield()**：当前线程让出CPU资源，重新进入就绪状态，让优先级相同或更高的线程获得调度（不保证一定成功）。
4. **同步工具类**：如CountDownLatch（等待多线程完成）、CyclicBarrier（线程间互相等待）等。
5. **管道流**：如PipedInputStream/PipedOutputStream，用于线程间字节流通信。


## 二、JMM（Java内存模型）
### 1. 什么是JMM？其核心目的是什么？
**答案**：  
JMM是Java内存模型（Java Memory Model），是一种抽象模型，定义了线程和主内存之间的交互规则：
- 所有共享变量存储在**主内存**中，线程无法直接操作主内存。
- 线程操作共享变量时，需先将变量从主内存加载到**工作内存**（线程私有），操作完成后再写回主内存。

**核心目的**：解决多线程环境下由于CPU缓存、指令重排序导致的**内存可见性、原子性、有序性**问题，保证并发编程的正确性。


### 2. JMM中的happens-before原则是什么？包含哪些具体规则？
**答案**：  
happens-before（先行发生）原则定义了多线程操作的可见性：如果操作A happens-before操作B，则A的执行结果对B可见，且A的执行顺序在B之前。

**8条核心规则**：
1. **程序次序规则**：同一线程内，按代码顺序，前面的操作happens-before后面的操作。
2. **volatile变量规则**：对volatile变量的写操作happens-before后续的读操作。
3. **锁规则**：解锁操作happens-before后续的加锁操作。
4. **线程启动规则**：Thread.start() happens-before线程内的所有操作。
5. **线程终止规则**：线程内的所有操作happens-before线程终止检测（如join()返回、isAlive()为false）。
6. **线程中断规则**：interrupt()调用happens-before被中断线程检测到中断事件。
7. **传递性**：若A happens-before B，B happens-before C，则A happens-before C。
8. **对象终结规则**：对象的构造函数执行完毕happens-before其finalize()方法。


### 3. volatile关键字的作用是什么？为什么不能保证原子性？
**答案**：  
**作用**：
1. **可见性**：对volatile变量的写操作会立即刷新到主内存，读操作会从主内存加载，保证多线程间变量可见。
2. **有序性**：禁止指令重排序（通过内存屏障实现），如防止双重检查锁单例中的空指针问题。

**不能保证原子性**：  
原子性指“不可分割的操作”，而volatile仅保证可见性和有序性。例如`i++`（实际是read→modify→write三步），多线程并发时可能出现中间状态被覆盖，导致结果错误。


### 4. 什么是指令重排序？JMM如何禁止特定重排序？
**答案**：  
**指令重排序**：CPU或编译器为优化性能，在不影响单线程执行结果的前提下，调整指令执行顺序（如加载、存储指令的重排）。

**JMM禁止重排序的方式**：  
通过**内存屏障**（Memory Barrier）指令，限制特定类型的重排序：
- **LoadLoad屏障**：禁止load操作重排。
- **StoreStore屏障**：禁止store操作重排。
- **LoadStore屏障**：禁止load后接store的重排。
- **StoreLoad屏障**：禁止store后接load的重排（最严格，volatile写后会插入此屏障）。

例如，volatile变量的写操作后会插入StoreLoad屏障，确保写操作结果对后续读操作可见。


## 三、线程池
### 1. 线程池的核心参数有哪些？各自的作用是什么？
**答案**：  
线程池核心参数（定义在`ThreadPoolExecutor`中）：
1. **corePoolSize**：核心线程数，线程池长期保留的线程数（即使空闲也不销毁）。
2. **maximumPoolSize**：最大线程数，线程池允许创建的最大线程数（核心线程+临时线程）。
3. **keepAliveTime**：临时线程的空闲存活时间，超过此时间则销毁。
4. **unit**：keepAliveTime的时间单位（如TimeUnit.SECONDS）。
5. **workQueue**：阻塞队列，用于存放待执行的任务（核心线程满时放入）。
6. **threadFactory**：线程工厂，用于创建线程（可自定义线程名称、优先级等）。
7. **handler**：拒绝策略，当任务数超过（最大线程数+队列容量）时的处理方式。


### 2. 线程池的拒绝策略有哪些？如何选择？
**答案**：  
JDK提供4种拒绝策略（实现`RejectedExecutionHandler`接口）：
1. **AbortPolicy**（默认）：直接抛出`RejectedExecutionException`，中断任务提交。
    - 适用场景：关键任务，需明确感知任务提交失败（如金融交易）。

2. **CallerRunsPolicy**：让提交任务的线程执行任务（“调用者运行”），减缓任务提交速度。
    - 适用场景：并发量不大，需避免任务丢失（如非核心日志处理）。

3. **DiscardPolicy**：默默丢弃无法处理的任务，不抛出异常。
    - 适用场景：任务可丢失（如非关键监控数据上报）。

4. **DiscardOldestPolicy**：丢弃队列中最旧的任务，尝试提交新任务。
    - 适用场景：任务有优先级，新任务比旧任务更重要（如实时数据处理）。

**选择原则**：根据业务对任务丢失的容忍度、是否需要告警、系统负载等综合选择，建议自定义拒绝策略（如记录日志+重试）。


### 3. 线程池的运行流程是什么？
**答案**：  
线程池处理任务的核心流程：
1. 当提交任务时，若当前线程数 < corePoolSize，直接创建核心线程执行任务。
2. 若核心线程已满，将任务放入workQueue阻塞队列。
3. 若队列已满，且当前线程数 < maximumPoolSize，创建临时线程执行任务。
4. 若临时线程也达到maximumPoolSize，触发拒绝策略处理任务。
5. 当临时线程空闲时间超过keepAliveTime，销毁临时线程。


### 4. Executors提供的默认线程池有哪些？为什么不推荐使用？
**答案**：  
默认线程池及问题：
1. **FixedThreadPool(n)**：核心线程数=最大线程数=n，队列用`LinkedBlockingQueue`（容量无限）。
    - 问题：任务堆积可能导致OOM（内存溢出）。

2. **CachedThreadPool()**：核心线程数=0，最大线程数=Integer.MAX_VALUE，队列用`SynchronousQueue`。
    - 问题：高并发下创建大量线程，可能导致CPU耗尽或OOM。

3. **SingleThreadExecutor()**：核心线程数=最大线程数=1，队列容量无限。
    - 问题：同FixedThreadPool，任务堆积易OOM。

4. **ScheduledThreadPool(n)**：用于定时任务，核心线程数=n，最大线程数=Integer.MAX_VALUE。
    - 问题：高并发下可能创建过多线程导致OOM。

**推荐**：使用`ThreadPoolExecutor`手动创建线程池，指定核心参数（尤其是队列容量），避免资源耗尽风险。


### 5. 如何确定线程池的核心线程数？
**答案**：  
核心线程数需根据任务类型（CPU密集型/IO密集型）确定：
- **CPU密集型任务**（如计算）：线程数=CPU核心数±1（避免线程切换开销，充分利用CPU）。
- **IO密集型任务**（如网络请求、数据库操作）：线程数=CPU核心数×2（利用IO等待时间让其他线程运行）。

**实际调整**：结合系统负载、任务平均耗时、并发量等，通过压测确定最优值（如监控线程池的activeCount、队列长度，避免线程空闲或任务堆积）。


## 四、锁机制
### 1. synchronized的作用是什么？其锁优化（锁升级）过程是怎样的？
**答案**：  
**作用**：保证同步块的原子性（同一时间只有一个线程执行）、可见性（解锁时刷新主内存）、有序性（禁止指令重排序）。

**锁升级过程**（JDK6+的优化，从无锁到重量级锁）：
1. **无锁状态**：对象刚创建，未被任何线程锁定。
2. **偏向锁**：同一线程多次获取锁时，仅在第一次CAS设置线程ID，后续直接通过线程ID判断，避免锁竞争（适用于单线程重复加锁场景）。
3. **轻量级锁**：当有其他线程竞争时，偏向锁撤销，线程通过CAS将对象头的Mark Word替换为锁记录指针（适用于短时间、低竞争场景，避免重量级锁的内核态切换）。
4. **重量级锁**：若轻量级锁的CAS竞争失败，膨胀为重量级锁（依赖操作系统的互斥量mutex），未抢到锁的线程进入阻塞状态（适用于高竞争、长耗时场景）。


### 2. synchronized与ReentrantLock的区别和优缺点？
**答案**：  
| 维度               | synchronized                          | ReentrantLock                          |  
|--------------------|---------------------------------------|----------------------------------------|  
| 锁实现             | JVM底层指令（monitorenter/monitorexit） | JDK层面，基于AQS实现                    |  
| 可中断性           | 不可中断（一旦阻塞无法被中断）         | 可中断（tryLock(long, TimeUnit)或lockInterruptibly()） |  
| 公平性             | 非公平锁                              | 可指定公平/非公平锁（构造函数参数）      |  
| 条件队列           | 仅一个等待队列（通过wait/notify）      | 多个条件队列（通过Condition接口）        |  
| 锁释放             | 自动释放（同步块结束）                 | 必须手动释放（需在finally中调用unlock()） |  
| 性能               | JDK6+优化后与ReentrantLock接近         | 高竞争场景下性能更优（可灵活控制）       |

**优缺点**：
- synchronized：优点是简单易用、自动释放锁、JVM优化好；缺点是功能有限（不可中断、无公平性选择）。
- ReentrantLock：优点是功能丰富（可中断、公平锁、多条件队列）；缺点是需手动释放锁，易因遗漏导致死锁。


### 3. AQS的核心原理是什么？其内部结构包含哪些部分？
**答案**：  
AQS（AbstractQueuedSynchronizer）是JUC中锁和同步工具的基础框架，基于**模板方法模式**实现。

**核心原理**：
- 用**volatile int state**表示同步状态（如0=未锁定，1=锁定）。
- 定义了获取/释放同步状态的模板方法（如acquire()、release()），具体逻辑由子类实现（通过重写tryAcquire()、tryRelease()等钩子方法）。
- 维护一个**双向同步队列（CLH队列）**，用于存放等待锁的线程（Node节点包含线程引用、等待状态等）。

**内部结构**：
1. **state**：同步状态变量（volatile修饰，保证可见性）。
2. **head/tail**：同步队列的头/尾节点（Node类型）。
3. **Node**：队列节点，包含：
    - thread：等待的线程。
    - waitStatus：节点状态（如CANCELLED、SIGNAL等）。
    - prev/next：前驱/后继节点指针。


### 4. ReentrantLock如何实现可重入性？公平锁与非公平锁的区别是什么？
**答案**：  
**可重入性实现**：
- 基于AQS的state变量：线程首次获取锁时，CAS将state从0改为1。
- 同一线程再次获取锁时，直接将state加1（无需CAS）。
- 释放锁时，state减1，直到state=0时完全释放锁，唤醒队列中的线程。

**公平锁与非公平锁的区别**：
- **公平锁**：线程获取锁的顺序与请求顺序一致（先到先得），通过判断同步队列中是否有前驱节点实现（`hasQueuedPredecessors()`）。
- **非公平锁**：线程获取锁时先尝试CAS抢锁，失败后再入队（可能插队），效率更高但可能导致线程饥饿。

**性能**：非公平锁效率高于公平锁（减少线程切换），默认使用非公平锁。


### 5. Condition接口的作用是什么？与wait/notify有什么区别？
**答案**：  
**Condition接口**：与ReentrantLock配合使用，实现线程的分组等待/通知（需通过`lock.newCondition()`创建）。

**与wait/notify的区别**：  
| 维度         | wait/notify                  | Condition                    |  
|--------------|------------------------------|------------------------------|  
| 关联锁       | 依赖synchronized锁           | 依赖ReentrantLock            |  
| 等待队列数量 | 一个等待队列                 | 多个条件队列（可分组等待）   |  
| 唤醒方式     | notify()唤醒随机线程，notifyAll()唤醒所有线程 | signal()唤醒单个线程，signalAll()唤醒所有线程，可精确唤醒指定队列 |  
| 中断响应     | wait()可响应中断（抛出InterruptedException） | await()可响应中断，还支持限时等待（await(long, TimeUnit)） |


## 五、CAS与原子类
### 1. 什么是CAS？其底层实现原理是什么？
**答案**：  
CAS（Compare-And-Swap，比较并交换）是一种无锁同步机制，核心逻辑：
- 假设内存地址V的值为A，若要将其更新为B，仅当V的当前值仍为A时，才更新为B（否则不做操作）。
- 过程是原子的（由CPU指令保证）。

**底层实现**：  
Java通过`Unsafe`类的native方法（如`compareAndSwapInt()`）调用CPU的原子指令（如x86的`cmpxchg`），直接操作内存地址，保证操作的原子性。


### 2. CAS存在哪些问题？如何解决？
**答案**：  
**问题及解决**：
1. **ABA问题**：
    - 描述：变量从A→B→A，CAS会误认为未被修改，导致错误更新。
    - 解决：添加版本号（如`AtomicStampedReference`，通过“值+版本号”判断）。

2. **自旋开销**：
    - 描述：CAS失败时会循环重试（自旋），高并发下导致CPU空耗。
    - 解决：自适应自旋（JVM根据历史重试情况调整自旋次数）；结合锁机制（如轻量级锁升级为重量级锁）。

3. **只能保证单个变量原子性**：
    - 描述：CAS无法直接保证多个变量的原子操作。
    - 解决：将多个变量封装为对象，通过`AtomicReference`操作对象的原子性。


### 3. JUC原子类有哪些分类？各举一个例子。
**答案**：  
JUC原子类基于CAS实现，分为4类：
1. **基本类型原子类**：操作基本数据类型（int、long、boolean）。
    - 例子：`AtomicInteger`（原子更新int）、`AtomicLong`。

2. **引用类型原子类**：操作对象引用。
    - 例子：`AtomicReference<User>`（原子更新User对象）、`AtomicStampedReference`（解决ABA问题）。

3. **数组原子类**：操作数组元素。
    - 例子：`AtomicIntegerArray`（原子更新int数组）、`AtomicLongArray`。

4. **字段更新器**：原子更新对象的字段（无需字段为volatile）。
    - 例子：`AtomicIntegerFieldUpdater`（原子更新对象的int字段）。


### 4. LongAdder与AtomicLong的区别是什么？适用场景有哪些？
**答案**：  
**区别**：
- **AtomicLong**：基于CAS直接更新单变量，高并发下大量线程自旋重试，性能下降。
- **LongAdder**（JDK8+）：将单变量拆分多个“细胞变量”（cells数组），线程优先更新自己的细胞变量，最后汇总结果，减少CAS竞争。

**适用场景**：
- AtomicLong：低并发场景，或需要精确获取当前值（如`get()`）。
- LongAdder：高并发下的计数场景（如QPS统计），优先保证写入性能，`sum()`获取近似值（最终一致）。


## 六、ThreadLocal
### 1. ThreadLocal的作用是什么？底层实现原理是什么？
**答案**：  
**作用**：提供线程私有变量，每个线程可独立修改自己的副本，避免线程安全问题（如存储用户上下文、数据库连接）。

**底层实现**：
- 每个Thread对象包含`threadLocals`字段（类型为`ThreadLocalMap`，自定义哈希表）。
- ThreadLocalMap的key是ThreadLocal实例（弱引用），value是线程私有变量。
- 当调用`ThreadLocal.set(value)`时，实际是往当前线程的ThreadLocalMap中添加键值对（key=当前ThreadLocal，value=传入值）。


### 2. ThreadLocal为什么会发生内存泄漏？如何避免？
**答案**：  
**内存泄漏原因**：
- ThreadLocalMap的Entry中，key是**弱引用**（ThreadLocal实例），value是**强引用**（线程变量）。
- 当ThreadLocal实例被回收（key为null），若线程未销毁，value的强引用会导致其无法被GC回收，造成内存泄漏。

**避免方式**：
1. 使用后主动调用`ThreadLocal.remove()`，清除Entry（删除value的强引用）。
2. 避免使用静态ThreadLocal（生命周期长，易累积未清理的value）。
3. 线程池场景中，需在任务结束时remove()（线程复用可能导致value被后续任务误用）。


### 3. ThreadLocal与Synchronized的区别是什么？
**答案**：  
| 维度         | ThreadLocal                     | Synchronized                  |  
|--------------|---------------------------------|--------------------------------|  
| 核心思想     | 空间换时间（每个线程一个副本）   | 时间换空间（共享资源加锁）     |  
| 线程安全方式 | 变量私有，无共享                | 限制共享资源的并发访问         |  
| 适用场景     | 线程内共享变量（如上下文传递）   | 多线程共享资源（如计数器）     |


## 七、并发工具类
### 1. CountDownLatch的作用是什么？底层原理是什么？
**答案**：  
**作用**：让一个线程等待其他多个线程完成后再执行（如主线程等待所有子线程初始化完成）。

**原理**：
- 基于AQS实现，构造函数传入计数器count。
- 子线程执行完毕调用`countDown()`，计数器减1（AQS的state减1）。
- 主线程调用`await()`，若state>0则进入AQS同步队列阻塞；当state=0时，唤醒所有等待线程。


### 2. CyclicBarrier与CountDownLatch的区别是什么？
**答案**：  
| 维度         | CyclicBarrier                    | CountDownLatch                  |  
|--------------|----------------------------------|---------------------------------|  
| 核心功能     | 多个线程互相等待，到达屏障后一起执行 | 一个线程等待其他线程完成        |  
| 可重用性     | 可重用（调用`reset()`重置计数器） | 不可重用（计数器到0后无法重置） |  
| 计数器操作   | 由参与线程自身触发（调用`await()`） | 由外部线程触发（调用`countDown()`） |  
| 适用场景     | 分阶段任务（如数据分片处理后合并） | 等待初始化（如主线程等子线程）  |


### 3. Semaphore的作用是什么？如何使用？
**答案**：  
**作用**：控制并发访问资源的线程数（信号量），如限制数据库连接数、接口限流。

**使用方式**：
- 构造函数传入许可数permits（初始信号量）。
- 线程获取资源前调用`acquire()`（获取许可，permits减1，无许可则阻塞）。
- 线程释放资源后调用`release()`（释放许可，permits加1，唤醒等待线程）。

示例：
```java
Semaphore semaphore = new Semaphore(5); // 最多5个线程同时访问
for (int i = 0; i < 10; i++) {
    new Thread(() -> {
        try {
            semaphore.acquire(); // 获取许可
            // 访问资源
        } catch (InterruptedException e) {
            e.printStackTrace();
        } finally {
            semaphore.release(); // 释放许可
        }
    }).start();
}
```  


## 八、并发容器
### 1. ConcurrentHashMap在JDK7和JDK8中的实现有什么区别？
**答案**：  
| 维度         | JDK7 ConcurrentHashMap          | JDK8 ConcurrentHashMap          |  
|--------------|----------------------------------|----------------------------------|  
| 数据结构     | 数组+分段锁（Segment）+链表      | 数组+CAS+synchronized+链表/红黑树 |  
| 锁机制       | 分段锁（每个Segment独立加锁）    | 节点锁（仅锁定冲突的链表头/红黑树根节点） |  
| 并发度       | 等于Segment数量（默认16）        | 理论上等于数组长度，并发度更高   |  
| 红黑树优化   | 无                              | 链表长度>8且数组长度≥64时转红黑树 |


### 2. CopyOnWriteArrayList的原理是什么？适用场景有哪些？
**答案**：  
**原理**：基于“写时复制”（Copy-On-Write）机制：
- 底层维护一个volatile数组，读操作直接访问数组，无需加锁。
- 写操作（add/remove）时，复制一份新数组，在新数组中修改，完成后将引用指向新数组（volatile保证可见性）。

**适用场景**：读操作远多于写操作的场景（如配置缓存、日志列表），读操作无锁高效，写操作频率低时复制开销可接受。


## 九、线程安全与死锁
### 1. 线程安全的定义是什么？实现线程安全的方式有哪些？
**答案**：  
**定义**：多线程环境下，程序的执行结果与单线程执行结果一致，且无数据竞争（即无需额外同步机制即可保证正确性）。

**实现方式**：
1. **互斥同步**：通过锁（synchronized/ReentrantLock）保证同一时间只有一个线程执行临界区。
2. **非阻塞同步**：基于CAS和原子类（如AtomicInteger），无锁竞争，性能更高。
3. **无同步方案**：
    - 不可变对象（如String、Integer）：对象创建后状态不变，天然线程安全。
    - ThreadLocal：变量线程私有，避免共享。
4. **volatile**：保证共享变量的可见性和有序性（不保证原子性）。


### 2. 死锁的产生条件是什么？如何避免和排查死锁？
**答案**：  
**产生条件**（4个缺一不可）：
1. **资源互斥**：资源只能被一个线程占用。
2. **持有并等待**：线程持有部分资源，同时等待其他资源。
3. **不可剥夺**：资源不能被强制剥夺。
4. **循环等待**：多个线程形成资源请求循环（如A等B的资源，B等A的资源）。

**避免方式**：
- 破坏“循环等待”：统一资源申请顺序（如按资源ID升序申请）。
- 破坏“持有并等待”：一次性申请所有资源。
- 使用定时锁（如`tryLock(timeout)`），超时则释放已持有的资源。

**排查方式**：
1. `jstack <pid>`：查看线程堆栈，搜索“deadlock”关键字。
2. VisualVM/JConsole：监控线程状态，检测死锁。


## 十、异步编程
### 1. CompletableFuture的作用是什么？相比FutureTask有哪些优势？
**答案**：  
**作用**：实现异步编程，支持异步任务的链式调用、异常处理、多任务组合，无需阻塞等待任务结果。

**相比FutureTask的优势**：  
| 维度         | FutureTask                       | CompletableFuture               |  
|--------------|----------------------------------|----------------------------------|  
| 任务链       | 不支持，需手动获取结果后串联任务 | 支持（thenApply()、thenAccept()等） |  
| 异常处理     | 需手动捕获，易丢失               | 内置whenComplete()、exceptionally() |  
| 多任务组合   | 不支持                           | 支持allOf()（所有完成）、anyOf()（任一完成） |  
| 阻塞性       | get()方法阻塞当前线程            | 可非阻塞处理结果（如thenAccept()回调） |


### 2. 如何使用CompletableFuture实现多任务并行执行并汇总结果？
**答案**：  
使用`CompletableFuture.allOf()`等待所有任务完成，再获取各自结果汇总：

```java
// 定义3个异步任务
CompletableFuture<Integer> task1 = CompletableFuture.supplyAsync(() -> 10);
CompletableFuture<Integer> task2 = CompletableFuture.supplyAsync(() -> 20);
CompletableFuture<Integer> task3 = CompletableFuture.supplyAsync(() -> 30);

// 等待所有任务完成
CompletableFuture<Void> allTask = CompletableFuture.allOf(task1, task2, task3);

// 汇总结果
allTask.thenRun(() -> {
    try {
        int sum = task1.get() + task2.get() + task3.get();
        System.out.println("总和：" + sum); // 输出60
    } catch (Exception e) {
        e.printStackTrace();
    }
});
```
**说明**：`allOf()`返回一个CompletableFuture<Void>，当所有任务完成后触发`thenRun()`中的汇总逻辑。