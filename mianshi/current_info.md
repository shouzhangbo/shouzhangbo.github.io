# Java并发编程部分面试资料

## 1. Java内存模型（JMM）

### 1.1 内存模型抽象
- **主内存**：所有线程共享的内存区域，存储变量（如实例字段、静态字段、数组元素）。
- **工作内存**：每个线程私有的内存区域，存储主内存变量的副本。线程对变量的操作必须在工作内存中进行，不能直接读写主内存。

**八种原子操作**（JSR-133已简化，但了解有助于理解）：
- `lock`（锁定）、`unlock`（解锁）、`read`（读取）、`load`（载入）、`use`（使用）、`assign`（赋值）、`store`（存储）、`write`（写入）。

**交互规则**：
- `read` 和 `load`、`store` 和 `write` 必须成对出现。
- 不允许线程丢弃最近的 `assign` 操作。
- 不允许线程将没有 `assign` 的数据同步到主内存。
- 变量在工作内存中改变后必须同步回主内存。
- 变量只能在主内存中诞生。

### 1.2 重排序
- **编译器重排序**：编译器优化指令顺序。
- **处理器重排序**：指令级并行技术，如乱序执行。
- **内存系统重排序**：缓存一致性导致的可见性问题。

**as-if-serial**：无论怎么重排序，单线程程序的执行结果不能改变。

### 1.3 happens-before规则
- **定义**：如果操作A happens-before 操作B，那么A的执行结果对B可见，且A的执行顺序在B之前（按此规则）。
- **规则**：
  1. **程序顺序规则**：一个线程中的每个操作，happens-before 于该线程中的任意后续操作。
  2. **监视器锁规则**：对一个锁的解锁，happens-before 于随后对这个锁的加锁。
  3. **volatile变量规则**：对一个volatile域的写，happens-before 于任意后续对这个volatile域的读。
  4. **传递性**：如果A happens-before B，且B happens-before C，则A happens-before C。
  5. **线程启动规则**：Thread对象的start()方法happens-before于该线程的每一个动作。
  6. **线程终止规则**：线程中的所有操作happens-before于其他线程检测到该线程终止（如Thread.join()返回、Thread.isAlive()==false）。
  7. **线程中断规则**：对线程interrupt()方法的调用happens-before于被中断线程检测到中断事件（通过Thread.interrupted()）。
  8. **对象终结规则**：一个对象的初始化完成（构造方法结束）happens-before于它的finalize()方法的开始。

### 1.4 volatile内存语义
- **可见性**：写volatile变量时，立即刷新到主内存；读volatile变量时，从主内存重新加载。
- **禁止重排序**：插入内存屏障阻止特定类型的重排序。
  - 在每个volatile写操作前面插入一个StoreStore屏障（防止写操作与之前的写操作重排序）。
  - 在每个volatile写操作后面插入一个StoreLoad屏障（防止写操作与之后的读操作重排序）。
  - 在每个volatile读操作后面插入LoadLoad屏障和LoadStore屏障。

### 1.5 内存屏障
- **LoadLoad屏障**：确保Load1数据的装载先于Load2及所有后续装载指令的装载。
- **StoreStore屏障**：确保Store1数据对其他处理器可见（刷新到内存）先于Store2及所有后续存储指令的存储。
- **LoadStore屏障**：确保Load1数据装载先于Store2及所有后续存储指令刷新到内存。
- **StoreLoad屏障**：确保Store1数据对其他处理器可见先于Load2及所有后续装载指令的装载。该屏障会使得该屏障之前的所有内存访问指令完成之后，才执行该屏障之后的内存访问指令。

**面试题**：
- **Q：volatile能保证原子性吗？**
  - 不能。volatile只保证可见性和有序性，不保证复合操作（如i++）的原子性。例如多个线程同时对volatile变量i执行i++，最终结果可能小于预期。

- **Q：JMM中为什么要有happens-before规则？**
  - 为了程序员易于理解，无需深入了解重排序的细节。只要遵循happens-before规则，就能保证并发程序的正确性。

- **Q：解释一下内存屏障的作用？**
  - 内存屏障是一种CPU指令，用于禁止特定类型的重排序，同时可以强制刷新缓存，保证可见性。JMM通过插入内存屏障来实现volatile的语义。

## 2. 线程基础

### 2.1 线程的生命周期与状态转换
**Java线程六种状态**（Thread.State枚举）：
- **NEW**：线程创建但未启动。
- **RUNNABLE**：可运行状态，包括就绪和运行中。
- **BLOCKED**：阻塞等待监视器锁（synchronized块）。
- **WAITING**：无限期等待，需其他线程唤醒（Object.wait、Thread.join、LockSupport.park）。
- **TIMED_WAITING**：超时等待，到达时间自动唤醒（Thread.sleep、Object.wait(timeout)、Thread.join(timeout)、LockSupport.parkNanos）。
- **TERMINATED**：线程执行完毕。

**状态转换图**（略，但需熟记）。

### 2.2 创建线程的方式
1. **继承Thread类**：重写run()方法。
   ```java
   class MyThread extends Thread {
       public void run() { ... }
   }
   new MyThread().start();
   ```
2. **实现Runnable接口**：实现run()方法，传给Thread。
   ```java
   class MyRunnable implements Runnable {
       public void run() { ... }
   }
   new Thread(new MyRunnable()).start();
   ```
3. **实现Callable接口 + FutureTask**：可返回结果并抛出异常。
   ```java
   class MyCallable implements Callable<Integer> {
       public Integer call() { return 1; }
   }
   FutureTask<Integer> task = new FutureTask<>(new MyCallable());
   new Thread(task).start();
   Integer result = task.get(); // 阻塞获取结果
   ```
4. **线程池**：通过ExecutorService提交任务。

### 2.3 常用方法
- **sleep**：线程休眠指定毫秒，不释放锁。
- **yield**：提示调度器让出CPU，但可能立即又被调度。
- **join**：等待目标线程终止。当前线程阻塞，直到目标线程执行完。
- **interrupt**：中断线程，设置中断标志。被中断的线程需通过`isInterrupted()`或`Thread.interrupted()`检查标志并响应（通常抛出InterruptedException时清除标志）。
- **isInterrupted**：返回中断标志，不清除。
- **interrupted**：静态方法，返回当前线程中断标志并清除。

**面试题**：
- **Q：sleep() 和 wait() 的区别？**
  - sleep() 是Thread的静态方法，不释放锁；wait() 是Object的方法，释放锁并进入等待队列，需在同步块中调用。
  - sleep() 必须指定时间；wait() 可指定时间也可无限等待。
  - sleep() 到时间自动唤醒；wait() 需 notify/notifyAll 唤醒。

- **Q：如何停止一个线程？**
  - 不推荐使用 stop()（已废弃），会导致数据不一致。
  - 正确方式：使用中断标志，在线程的run()中循环检查 `Thread.currentThread().isInterrupted()`，收到中断信号后清理资源并退出。对于阻塞方法（如sleep、wait），会抛出InterruptedException，应捕获并处理（通常重置中断标志或直接退出）。

- **Q：守护线程（Daemon）的作用？**
  - 守护线程是为用户线程服务的，如垃圾回收线程。当所有用户线程结束后，JVM退出，守护线程自动终止。设置：`thread.setDaemon(true)` 必须在start()之前。

## 3. 线程池

### 3.1 ThreadPoolExecutor 核心参数
```java
public ThreadPoolExecutor(int corePoolSize,
                          int maximumPoolSize,
                          long keepAliveTime,
                          TimeUnit unit,
                          BlockingQueue<Runnable> workQueue,
                          ThreadFactory threadFactory,
                          RejectedExecutionHandler handler)
```
- **corePoolSize**：核心线程数，即使空闲也会保留（除非设置allowCoreThreadTimeOut）。
- **maximumPoolSize**：最大线程数。
- **keepAliveTime**：非核心线程空闲存活时间，若超过则终止。
- **unit**：时间单位。
- **workQueue**：任务队列，存放等待执行的任务。
- **threadFactory**：线程工厂，用于创建线程（可自定义名称、优先级等）。
- **handler**：拒绝策略，当队列和最大线程数都满时的处理方式。

### 3.2 工作队列（BlockingQueue）
- **ArrayBlockingQueue**：有界队列，FIFO。
- **LinkedBlockingQueue**：可选有界，默认Integer.MAX_VALUE（无界），FIFO。
- **SynchronousQueue**：不存储任务，直接提交给线程，若没有空闲线程则创建新线程（吞吐量高，但风险大）。
- **PriorityBlockingQueue**：优先级队列，任务需实现Comparable或传入Comparator。
- **DelayQueue**：延迟队列，用于定时任务调度。

### 3.3 拒绝策略（RejectedExecutionHandler）
- **AbortPolicy**（默认）：抛出RejectedExecutionException。
- **CallerRunsPolicy**：由调用者线程执行任务（降低提交速度，减缓压力）。
- **DiscardPolicy**：静默丢弃任务。
- **DiscardOldestPolicy**：丢弃队列中最旧的任务，然后重新尝试提交。

### 3.4 常用线程池（Executors 工厂方法）
- **FixedThreadPool**：固定核心线程数，无界队列（LinkedBlockingQueue）。适用于负载较重的服务器。
- **CachedThreadPool**：核心0，最大Integer.MAX_VALUE，SynchronousQueue，空闲60秒回收。适用于大量短生命周期任务。
- **SingleThreadExecutor**：单线程，无界队列，保证任务顺序执行。
- **ScheduledThreadPool**：支持定时及周期性任务，使用DelayedWorkQueue。
- **WorkStealingPool**（ForkJoinPool）：工作窃取，适用于CPU密集型任务。

**注意**：阿里巴巴开发手册禁止使用Executors创建线程池，因为FixedThreadPool和SingleThreadExecutor允许的队列长度太大（可能堆积大量请求），CachedThreadPool和ScheduledThreadPool允许的线程数太大（可能创建过多线程）。应使用ThreadPoolExecutor直接创建，明确参数。

### 3.5 线程池监控与动态调整
- **监控方法**：
  - `getPoolSize()`：当前线程池大小。
  - `getActiveCount()`：活跃线程数。
  - `getCompletedTaskCount()`：已完成任务数。
  - `getTaskCount()`：任务总数（近似）。
  - `getQueue().size()`：队列中等待任务数。
- **动态调整**：
  - `setCorePoolSize()`：调整核心线程数。
  - `setMaximumPoolSize()`：调整最大线程数。
  - `allowCoreThreadTimeOut(true)`：允许核心线程超时回收。

### 3.6 正确关闭线程池
- **shutdown()**：不再接受新任务，等待已提交任务执行完（包括队列中的）。
- **shutdownNow()**：尝试停止正在执行的任务（通过Thread.interrupt），返回等待执行的任务列表。
- **awaitTermination(long timeout, TimeUnit unit)**：阻塞直到所有任务完成或超时，通常与shutdown配合使用。

**面试题**：
- **Q：线程池的工作原理（提交任务时的处理流程）？**
  1. 如果当前线程数 < corePoolSize，即使有空闲线程，也会创建新线程处理任务。
  2. 如果 corePoolSize ≤ 当前线程数 < maximumPoolSize，则将任务加入 workQueue。
  3. 如果队列已满，且当前线程数 < maximumPoolSize，则创建新线程处理任务。
  4. 如果队列已满，且当前线程数 ≥ maximumPoolSize，则执行拒绝策略。

- **Q：如何合理设置线程池大小？**
  - **CPU密集型任务**：线程数 = CPU核心数 + 1（避免线程切换开销）。
  - **IO密集型任务**：线程数 = CPU核心数 * (1 + 平均等待时间/平均工作时间)。通常可设置多一些，如核心数 * 2。
  - 混合型任务可拆分。
  - 也需考虑内存、队列大小等因素，通过压测确定最佳值。

- **Q：线程池中线程异常会怎样？**
  - 如果任务没有捕获异常，线程会退出。但线程池会创建新线程来补充，不影响整体运行。可以通过设置UncaughtExceptionHandler处理。

## 4. 锁机制

### 4.1 synchronized 详解
- **使用方法**：
  - 修饰实例方法：锁当前实例对象（this）。
  - 修饰静态方法：锁当前类的Class对象。
  - 修饰代码块：需指定锁对象。
- **原理**：
  - **对象头**：Mark Word 存储锁状态、偏向线程ID、Epoch、年龄等。
  - **Monitor**：每个对象关联一个ObjectMonitor（C++实现），包含 _count、_owner、_WaitSet、_EntryList。
  - 字节码指令：monitorenter 和 monitorexit。
- **锁升级过程（JDK 1.6优化）**：
  - **无锁** -> **偏向锁**：当第一个线程获取锁时，Mark Word记录线程ID，以后该线程进入无需CAS操作。如果有竞争，撤销偏向，升级为轻量级锁。
  - **轻量级锁**：线程在自己的栈帧中创建锁记录（Lock Record），通过CAS将对象头的Mark Word替换为指向锁记录的指针。成功则获得锁，失败则自旋一定次数，若仍失败则膨胀为重量级锁。
  - **重量级锁**：通过Monitor实现，阻塞未获取锁的线程，避免CPU空转。

**锁降级**：在GC过程中可能发生，但通常不会主动降级。

**面试题**：
- **Q：synchronized 和 Lock 的区别？**
  - synchronized 是关键字，Lock 是接口。
  - synchronized 自动释放锁（异常或同步块结束），Lock 需手动 unlock（通常finally中）。
  - Lock 可尝试非阻塞获取锁（tryLock）、可中断（lockInterruptibly）、可超时。
  - Lock 可实现读写分离（ReentrantReadWriteLock）。
  - synchronized 锁状态无法在中断时响应；Lock 可响应中断。
  - 性能上，JDK 1.6 后 synchronized 做了大量优化，与Lock性能接近。

### 4.2 ReentrantLock
- **可重入性**：同一线程可多次获得同一把锁。
- **公平性**：构造函数传入 true 为公平锁（按等待时间排队），false 为非公平锁（默认）。非公平锁吞吐量更高，但可能引起线程饥饿。
- **实现原理**：基于 AQS。内部类 Sync 继承 AQS，FairSync 和 NonfairSync 实现 tryAcquire 方法。
- **常用方法**：
  - `lock()`：阻塞获取锁。
  - `tryLock()`：立即返回是否获得锁。
  - `tryLock(long timeout, TimeUnit unit)`：超时获取。
  - `lockInterruptibly()`：可中断获取。
  - `unlock()`：释放锁。
- **Condition**：通过 `newCondition()` 创建，提供 await/signal 机制，可绑定多个条件。

### 4.3 ReentrantReadWriteLock
- **特性**：读锁共享，写锁独占；读锁不能升级为写锁，写锁可降级为读锁。
- **适用场景**：读多写少，提高并发度。
- **实现**：AQS 中 state 的高16位表示读锁计数，低16位表示写锁持有数。读锁通过 CAS 修改高16位。

### 4.4 StampedLock
- **Java 8引入**，三种模式：
  - **写锁（writeLock）**：独占。
  - **悲观读锁（readLock）**：共享，类似ReentrantReadWriteLock的读锁。
  - **乐观读（tryOptimisticRead）**：不加锁，返回一个stamp，之后需验证stamp是否有效。若有效，说明期间没有写操作，可安全使用数据；若无效，则需升级为悲观读锁。
- **优点**：乐观读避免加锁开销，提高读并发。
- **注意**：不可重入，且不支持Condition。

### 4.5 AQS 原理
- **核心数据结构**：
  - **volatile int state**：同步状态，子类通过getState、setState、compareAndSetState操作。
  - **CLH变体队列**：双向链表，Node包含线程、等待状态（waitStatus）、前后指针。
- **独占模式**（如ReentrantLock）：
  - `acquire(int arg)`：先尝试 tryAcquire，成功则返回；失败则 addWaiter 加入队列，并 acquireQueued 自旋或阻塞。
  - `release(int arg)`：尝试 tryRelease，成功则唤醒后继节点。
- **共享模式**（如Semaphore、CountDownLatch）：
  - `acquireShared`：tryAcquireShared 返回值小于0表示失败，加入队列自旋。
  - `releaseShared`：tryReleaseShared 成功则唤醒后继。
- **Condition**：内部维护条件队列，通过 await/signal 将线程从同步队列移到条件队列，或反之。

**面试题**：
- **Q：AQS 如何实现可重入？**
  - 在 tryAcquire 中，判断当前线程是否是持有锁的线程，如果是，则 state+1，返回true。释放时 state-1，减到0才真正释放锁。

- **Q：LockSupport 的作用？**
  - LockSupport 是线程阻塞工具，底层调用 Unsafe 的 park/unpark。与 wait/notify 相比，无需持有锁，且 unpark 可以先于 park 执行（类似信号量）。AQS 中使用 LockSupport.park 阻塞线程。

## 5. 并发工具类

### 5.1 CountDownLatch
- **用途**：让一个或多个线程等待其他线程完成操作。计数器不可重用。
- **原理**：基于 AQS 共享模式。初始化 state = 计数。`countDown()` 调用 releaseShared 递减 state；`await()` 调用 acquireSharedInterruptibly，若 state != 0 则阻塞。

### 5.2 CyclicBarrier
- **用途**：让一组线程到达一个屏障时被阻塞，直到最后一个线程到达，屏障打开，所有线程继续。可重用（reset）。
- **原理**：内部使用 ReentrantLock 和 Condition。当到达的线程数达到 parties，触发 barrierAction（若有），然后唤醒所有等待线程，重置计数器。

### 5.3 Semaphore
- **用途**：控制同时访问资源的线程数，即限流。支持公平/非公平。
- **原理**：AQS 共享模式。state 表示剩余许可。acquire 时减少 state（若不足则阻塞），release 增加 state。

### 5.4 Exchanger
- **用途**：两个线程在某个点交换数据。如果只有一个线程到达，则阻塞直到另一个线程到达。
- **原理**：通过 CAS 和自旋实现，内部使用“槽”交换数据。

### 5.5 Phaser
- **用途**：JDK 7 引入，可动态调整参与者，支持多阶段栅栏。比 CyclicBarrier 和 CountDownLatch 更灵活。
- **常用方法**：register、arriveAndAwaitAdvance、arriveAndDeregister。

### 5.6 BlockingQueue 详解
- **ArrayBlockingQueue**：有界数组，一把锁（ReentrantLock）和两个条件（notEmpty、notFull）。
- **LinkedBlockingQueue**：可选有界，默认无界（Integer.MAX_VALUE），两把锁（takeLock、putLock）各自带条件，减少锁竞争。
- **SynchronousQueue**：不存储元素，每个 put 必须等待一个 take，反之亦然。适合传递性场景。
- **PriorityBlockingQueue**：无界优先队列，基于堆，使用一把锁。
- **DelayQueue**：延迟队列，元素需实现 Delayed，内部使用 PriorityQueue 和锁。

### 5.7 ConcurrentHashMap（并发集合）
- **JDK 7**：Segment 分段锁，每个 Segment 继承 ReentrantLock，默认并发度 16。
- **JDK 8**：摒弃分段锁，采用 CAS + synchronized 锁住桶的首节点。引入红黑树优化长链表。
- **重要方法**：
  - `put`：若桶为空，CAS 插入；否则 synchronized 锁住首节点，再操作。
  - `get`：无锁，Node 的 value 和 next 用 volatile 修饰，保证可见性。
  - `size`：通过 baseCount 和 CounterCell 累加。
  - `transfer`：扩容时多线程协助迁移（通过 ForwardingNode 标识已迁移桶）。

### 5.8 CopyOnWriteArrayList
- **原理**：写时复制，每次修改（add、set 等）都创建新数组，替换原数组。读操作无锁，直接读原数组。
- **适用场景**：读多写少，数据量小，对数据实时性要求不高（如缓存黑白名单）。
- **缺点**：内存占用高（两份数组），数据弱一致性。

### 5.9 原子类
- **基本类型**：AtomicInteger、AtomicLong、AtomicBoolean。
- **数组类型**：AtomicIntegerArray、AtomicLongArray、AtomicReferenceArray。
- **引用类型**：AtomicReference、AtomicStampedReference（解决ABA问题）、AtomicMarkableReference。
- **字段更新器**：AtomicIntegerFieldUpdater、AtomicReferenceFieldUpdater（基于反射，更新某个类的 volatile 字段）。
- **累加器**：LongAdder、LongAccumulator（JDK 8），适用于高并发统计，通过分段累加减少CAS竞争。

### 5.10 CAS 与 ABA 问题
- **CAS**：Compare And Swap，Unsafe 类提供 compareAndSwapXXX 方法，是硬件级别的原子操作。
- **ABA 问题**：变量值从 A 变为 B 又变回 A，CAS 无法察觉。解决：AtomicStampedReference 通过版本号或时间戳。

**面试题**：
- **Q：CountDownLatch 和 CyclicBarrier 的区别？**
  - CountDownLatch 是一个或多个线程等待其他线程完成事件，计数器不能重用；CyclicBarrier 是多个线程互相等待，到达屏障后可以重用。
  - CountDownLatch 基于 AQS 共享模式，CyclicBarrier 基于 ReentrantLock 和 Condition。
  - CountDownLatch 的 countDown 可由任意线程调用；CyclicBarrier 的 await 必须由所有参与线程调用。

- **Q：ConcurrentHashMap 的 size() 方法在 JDK 8 中如何实现？**
  - 通过 baseCount 和 CounterCell 数组。先尝试 CAS 增加 baseCount，若失败则使用 CounterCell 分散计数。最后累加 baseCount 和各个 CounterCell 的值。避免了 JDK 7 中加锁计算 size 的开销。

- **Q：LongAdder 和 AtomicLong 的区别？**
  - LongAdder 将单点压力分散到多个变量（cells），减少 CAS 冲突，适合高并发统计，但 sum 时可能不精确（最终一致）。AtomicLong 保证强一致性，但高并发下 CAS 重试多。LongAdder 适用于统计场景（如 QPS 计数），不适用于需要精确控制的场景。

## 6. volatile 与 final

### 6.1 volatile
- **作用**：
  - 保证可见性：对 volatile 变量的写立即刷新到主内存，读从主内存加载。
  - 禁止指令重排序：插入内存屏障。
- **不保证原子性**：如 i++ 需要加锁或使用原子类。

**典型应用**：
- 状态标志（如 boolean running）。
- 双重检查锁（DCL）中的单例模式。
- 作为读写锁的替代（如 volatile 数组引用）。

### 6.2 final
- **final 域的重排序规则**：
  - 在构造函数内对一个 final 域的写入，与随后把这个被构造对象的引用赋值给一个引用变量，这两个操作之间不能重排序（编译器保证）。
  - 初次读一个包含 final 域的对象的引用，与随后读这个 final 域，这两个操作之间不能重排序。
- **保证**：final 域在构造完成后对其他线程可见，且初始化安全（无需同步即可安全访问）。
- **注意**：如果 final 域是引用类型，只能保证引用本身不可变，对象内部状态仍可变。

## 7. ThreadLocal

### 7.1 原理
- 每个线程（Thread）内部维护一个 ThreadLocalMap 类型的变量 threadLocals。
- ThreadLocalMap 的 key 是 ThreadLocal 实例（弱引用），value 是线程局部变量值。
- 当调用 ThreadLocal 的 get/set 方法时，先获取当前线程的 ThreadLocalMap，再以自身为 key 查找。

### 7.2 内存泄漏分析
- 问题：ThreadLocalMap 中的 key 是弱引用，当 ThreadLocal 外部强引用被回收，key 在下一次 GC 时被回收，但 value 是强引用，且线程存活（如线程池复用线程），导致 value 无法被回收，产生内存泄漏。
- 解决：使用完 ThreadLocal 后，调用 remove() 方法清理 Entry。

### 7.3 应用场景
- 数据库连接管理（Spring 的 DataSourceTransactionManager 使用 ThreadLocal 保存 Connection）。
- 请求上下文（如用户信息、TraceId）。
- 日期格式化对象（SimpleDateFormat 非线程安全，可用 ThreadLocal 包装）。

**面试题**：
- **Q：ThreadLocal 的 set 方法如何实现？**
  ```java
  public void set(T value) {
      Thread t = Thread.currentThread();
      ThreadLocalMap map = getMap(t);
      if (map != null)
          map.set(this, value);
      else
          createMap(t, value);
  }
  ```
- **Q：为什么 ThreadLocalMap 的 key 使用弱引用？**
  - 如果 key 是强引用，即使外部 ThreadLocal 对象不再使用，由于线程的 ThreadLocalMap 持有 key 的强引用，导致 ThreadLocal 无法被回收，造成内存泄漏。使用弱引用可使 ThreadLocal 被回收时 key 自动变为 null，便于下一次清理。

- **Q：线程池中使用 ThreadLocal 需要注意什么？**
  - 由于线程复用，如果不清理 ThreadLocal，下一个任务可能会读取到上一个任务遗留的数据。必须在任务结束后调用 remove()。

## 8. Fork/Join 框架

### 8.1 核心思想
- 分治法：将大任务拆分为足够小的子任务，并行执行，最后合并结果。
- 工作窃取（Work-Stealing）：空闲线程从其他线程的任务队列尾部窃取任务执行，减少竞争。

### 8.2 核心类
- **ForkJoinPool**：工作窃取线程池。默认并行度 = CPU 核心数。
- **ForkJoinTask**：抽象任务类，有两个子类：
  - **RecursiveTask<V>**：有返回结果。
  - **RecursiveAction**：无返回结果。
- **ForkJoinTask 方法**：
  - `fork()`：异步提交子任务（放入当前线程的工作队列）。
  - `join()`：等待任务执行完成并返回结果。
  - `invoke()`：直接执行，并等待完成。

### 8.3 示例
```java
class SumTask extends RecursiveTask<Long> {
    private static final int THRESHOLD = 1000;
    private long[] array;
    private int start, end;
    // 构造省略
    protected Long compute() {
        if (end - start <= THRESHOLD) {
            long sum = 0;
            for (int i = start; i < end; i++) sum += array[i];
            return sum;
        }
        int mid = (start + end) / 2;
        SumTask left = new SumTask(array, start, mid);
        SumTask right = new SumTask(array, mid, end);
        left.fork(); // 异步执行
        long rightResult = right.compute();
        long leftResult = left.join(); // 等待结果
        return leftResult + rightResult;
    }
}
// 使用
ForkJoinPool pool = ForkJoinPool.commonPool();
Long result = pool.invoke(new SumTask(array, 0, array.length));
```

### 8.4 适用场景
- 大规模数据计算（如数组排序、矩阵乘法）。
- 递归分解的任务。
- 与 parallelStream 底层实现相关（公共 ForkJoinPool）。

## 9. 并发编程模型

### 9.1 生产者-消费者模式
- 使用 BlockingQueue 解耦，生产者 put，消费者 take。
- 多生产者多消费者需注意并发安全。

### 9.2 读写锁分离模式
- 使用 ReentrantReadWriteLock 或 StampedLock，提高读并发。

### 9.3 并行流水线模式
- 将任务分为多个阶段，每个阶段由一个线程处理，阶段间通过队列传递数据。类似 CPU 流水线。

### 9.4 Fork/Join 并行模型
- 分治 + 工作窃取。

### 9.5 Actor 模型
- 通过消息传递，避免共享状态（如 Akka）。

## 10. 并发编程最佳实践与常见陷阱

### 10.1 最佳实践
1. **使用线程池**，避免手动创建线程。
2. **优先使用并发容器**（如 ConcurrentHashMap、CopyOnWriteArrayList）替代同步容器。
3. **同步块尽量小**，减少锁持有时间。
4. **避免在同步块中调用外部方法**，可能导致死锁或性能下降。
5. **使用不可变对象**，天然线程安全。
6. **正确使用 ThreadLocal**，及时 remove。
7. **使用 CountDownLatch/CyclicBarrier 协调线程**，替代复杂的 wait/notify。
8. **高并发统计使用 LongAdder** 替代 AtomicLong。
9. **警惕伪共享（False Sharing）**：不同线程修改同一缓存行的不同变量导致缓存失效。可通过 @Contended 注解或缓存行填充解决。
10. **合理配置线程池参数**，根据任务类型调整。

### 10.2 常见陷阱
1. **HashMap 并发死循环**：JDK 7 扩容时头插法导致循环链表，应使用 ConcurrentHashMap。
2. **死锁**：嵌套锁、锁顺序不一致、动态锁顺序（如转账）。可通过固定锁顺序、使用 tryLock 超时避免。
3. **活锁**：线程不断重试但无法成功，可随机退避。
4. **线程饥饿**：低优先级线程始终得不到执行，读写锁中写线程饥饿，可用 StampedLock。
5. **i++ 原子性问题**：使用 AtomicInteger 或 synchronized。
6. **volatile 错误使用**：以为保证原子性。
7. **ThreadLocal 内存泄漏**：忘记 remove。
8. **发布溢出**：构造期间 this 引用逸出，导致未初始化对象被其他线程访问。不要在构造中启动线程或注册监听器。
9. **对共享变量未正确同步**：导致可见性问题。
10. **使用 synchronized 字符串常量**：不同地方的字符串常量可能引用同一对象，导致意外锁竞争。

**面试题**：
- **Q：什么是伪共享（False Sharing）？如何避免？**
  - 伪共享是指多个 CPU 核心同时修改位于同一缓存行（通常 64 字节）的不同变量，导致缓存行频繁失效，影响性能。避免方式：变量填充（补位到 64 字节）、使用 @Contended 注解（需 JVM 参数 -XX:-RestrictContended）。

- **Q：如何避免死锁？**
  - 避免嵌套锁，尽量只用一把锁；如果必须多把锁，确保所有线程以相同顺序获取锁；使用定时锁 tryLock；使用死锁检测工具（jstack）。

- **Q：什么是活锁？举例说明。**
  - 活锁是指线程虽然没有被阻塞，但由于条件不满足，不断重试且改变状态，却始终无法执行成功。例如两个线程互相谦让资源，互相释放锁又尝试获取对方锁，导致循环。解决：引入随机等待时间。

---

以上是 Java 并发编程部分的详细面试资料，涵盖了核心概念、原理、工具和常见问题。深入理解并能够结合实际场景分析，是应对资深开发面试的关键。