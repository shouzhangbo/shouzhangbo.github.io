# Java基础部分面试资料

## 1. 面向对象

### 1.1 三大特性：封装、继承、多态

| 特性   | 概念                                                                                                                                     | 优势                                                                                         |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 封装   | 将对象的属性（状态）和行为（方法）包装在类内部，通过访问修饰符控制外部访问。通常将属性私有化，提供公共的 getter/setter。                | 隐藏内部实现细节，提高安全性；降低模块间耦合；便于维护和扩展。                               |
| 继承   | 子类继承父类的非私有属性和方法，并可以扩展新功能或重写父类方法。Java 为单继承，但可通过接口实现多继承效果。                              | 代码复用；建立类之间的层次关系；是实现多态的前提。                                           |
| 多态   | 同一操作作用于不同对象，可以有不同的解释，产生不同的执行结果。两种形式：编译时多态（方法重载）和运行时多态（方法重写）。                 | 提高代码的灵活性和可扩展性；开闭原则的体现；允许以统一的方式处理不同子类的对象。             |

**常见面试题：**
- **Q：为什么 Java 不支持多继承？**
  - 若一个类同时继承两个父类，且两个父类有相同方法签名的方法，子类无法确定调用哪个，产生“菱形问题”。Java 通过接口实现多继承行为，接口中的方法默认是抽象的，实现类必须明确实现，从而避免了歧义。

- **Q：重写（Override）和重载（Overload）的区别？**
  - **重写**：发生在子类与父类之间，方法签名（方法名+参数列表）完全相同，返回类型可以是子类（协变返回类型），访问修饰符不能更严格，抛出的异常范围不能更宽。运行时多态。
  - **重载**：发生在同一类中，方法名相同，参数列表不同（类型、个数、顺序），与返回类型无关。编译时多态。

- **Q：静态方法可以被重写吗？**
  - 静态方法属于类，不属于实例，因此不能重写。如果子类定义了与父类相同的静态方法，称为“隐藏”（hides），调用时由引用类型决定，而不是运行时对象。

### 1.2 抽象类与接口

| 对比项           | 抽象类（abstract class）                                     | 接口（interface）                                                      |
| ---------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------- |
| 关键字           | `abstract`                                                   | `interface`                                                            |
| 实例化           | 不能实例化                                                   | 不能实例化                                                             |
| 成员变量         | 可以有实例变量、静态变量                                     | 默认 `public static final` 常量（Java 8+ 可定义静态方法，但变量仍是常量） |
| 方法             | 可以有抽象方法（无方法体）和具体方法                         | Java 8 前只能有抽象方法；Java 8 后可以有默认方法和静态方法；Java 9 后可以有私有方法 |
| 构造方法         | 可以有构造方法（供子类调用）                                 | 无构造方法                                                             |
| 访问修饰符       | 任意                                                         | 默认 `public`（方法）                                                  |
| 单继承/多实现    | 一个类只能继承一个抽象类                                     | 一个类可以实现多个接口                                                 |
| 设计思想         | 代码复用，定义模板方法（Template Method）                    | 定义行为规范，契约设计（如 Comparable、Runnable）                      |

**常见面试题：**
- **Q：什么时候用抽象类，什么时候用接口？**
  - 如果需要在多个相关类之间共享代码（基类），且需要定义非静态、非 final 的字段，使用抽象类。
  - 如果仅仅是为了定义一组规范，让无关的类实现相同的行为，使用接口。另外，Java 8 后接口可以有默认方法，一定程度上可以代替抽象类，但字段只能是常量。

- **Q：接口中的默认方法（default method）会引发多继承问题吗？**
  - 如果一个类同时实现了两个接口，且这两个接口有相同的默认方法，那么实现类必须重写该方法，否则编译错误。通过 `InterfaceName.super.methodName()` 可以指定调用哪个接口的默认方法，从而解决冲突。

## 2. 异常体系

### 2.1 异常分类
- **Throwable** 是异常和错误的顶级父类，分为 **Error** 和 **Exception**。
  - **Error**：系统内部错误或资源耗尽，如 `StackOverflowError`、`OutOfMemoryError`，程序无法处理，通常不捕获。
  - **Exception**：程序可处理的异常，分为受检异常（Checked Exception）和非受检异常（Unchecked Exception/RuntimeException）。
    - **受检异常**：编译时强制处理（try-catch 或 throws），如 `IOException`、`SQLException`。
    - **运行时异常**：继承自 `RuntimeException`，编译时不强制处理，如 `NullPointerException`、`IllegalArgumentException`。

### 2.2 异常处理机制
- **try-catch-finally**
  - `try` 块存放可能抛出异常的代码。
  - `catch` 块捕获特定异常，可以有多个 catch，顺序由子类到父类。
  - `finally` 块无论是否发生异常都会执行（除非 JVM 退出），通常用于释放资源。
- **try-with-resources（Java 7+）**
  - 自动关闭实现了 `AutoCloseable` 的资源（如流、数据库连接）。
  - 语法：`try (Resource res = new Resource()) { ... }`
  - 原理：编译器会生成 finally 块调用资源的 `close()` 方法，且可以抑制异常（如果 try 块和 close 都抛出异常，try 块的异常会被保留，close 的异常作为抑制异常附加）。

**常见面试题：**
- **Q：finally 块什么情况下不会执行？**
  - 在 try 或 catch 中调用 `System.exit()`。
  - JVM 崩溃。
  - 线程被杀死。
  - 无限循环或死锁导致无法执行到 finally。

- **Q：try-catch-finally 中如果 catch 和 finally 都有 return，最终返回哪个？**
  - 最终返回 finally 中的 return 值，因为 finally 总会执行，并且会覆盖 try/catch 中的 return。如果 finally 中没有 return，则返回 try/catch 中保存的值（但 finally 中修改返回值变量不会影响返回结果，除非是引用类型修改了对象内容）。

- **Q：请列举常见的 RuntimeException 及其含义。**
  - `NullPointerException`：调用 null 对象的方法或属性。
  - `IndexOutOfBoundsException`：数组或集合索引越界。
  - `IllegalArgumentException`：方法参数不合法。
  - `ClassCastException`：类型转换错误。
  - `NumberFormatException`：字符串转换为数字格式错误。
  - `ArithmeticException`：算术异常，如除以 0。

## 3. 集合框架

### 3.1 List 接口

#### ArrayList
- **底层实现**：动态数组（Object[]）。
- **初始化**：默认容量为 10（JDK 8 中懒加载，第一次添加时扩容）。
- **扩容机制**：每次扩容为原来的 1.5 倍（`oldCapacity + (oldCapacity >> 1)`），使用 `Arrays.copyOf` 复制新数组。
- **特点**：随机访问快（O(1)），插入和删除慢（需要移动元素，O(n)）。线程不安全。

#### LinkedList
- **底层实现**：双向链表（Node 节点，包含 prev、next、item）。
- **特点**：插入和删除快（仅修改指针，O(1)），随机访问慢（需要遍历，O(n)）。可用作队列、双端队列（实现了 Deque 接口）。
- **内存占用**：比 ArrayList 多存储前后指针，但不需要预留容量。

**面试题：**
- **Q：ArrayList 和 LinkedList 的使用场景？**
  - 频繁随机访问、主要在尾部插入/删除：ArrayList。
  - 频繁在任意位置插入/删除，或者需要作为队列/栈：LinkedList。

- **Q：ArrayList 的 `subList` 方法有什么注意事项？**
  - `subList` 返回的是原列表的内部视图（`SubList` 类），对子列表的修改会反映到原列表。原列表结构修改（如增加/删除元素）后，子列表会失效，再次操作抛出 `ConcurrentModificationException`。

### 3.2 Set 接口

Set 特点：元素不可重复，基于 Map 实现。

- **HashSet**：基于 `HashMap`，元素作为 map 的 key，value 为一个固定的 Object。无序，允许 null，非线程安全。
- **LinkedHashSet**：继承自 `HashSet`，内部使用 `LinkedHashMap`，维护插入顺序（双向链表）。
- **TreeSet**：基于 `TreeMap`（红黑树），元素按自然顺序或自定义比较器排序。可保证元素唯一且有序。

**面试题：**
- **Q：HashSet 如何保证元素不重复？**
  - 添加元素时，底层调用 `HashMap.put`，key 为元素，value 为 PRESENT（静态常量）。HashMap 根据 key 的 `hashCode` 确定位置，再用 `equals` 比较，如果已存在相同 key，则覆盖并返回旧值，否则添加成功。Set 根据返回值判断是否添加成功。

- **Q：TreeSet 如何排序？**
  - 元素需实现 `Comparable` 接口，或者在构造 `TreeSet` 时传入 `Comparator`。TreeSet 在添加时会用比较器比较元素，红黑树保证有序。

### 3.3 Map 接口

#### HashMap（重点）
- **JDK 1.7**：数组 + 链表（Entry 节点），头插法（并发扩容可能形成循环链表），扩容时重新计算 hash。
- **JDK 1.8**：数组 + 链表 + 红黑树。当链表长度 > 8 且数组长度 ≥ 64 时，链表转为红黑树（TreeNode），否则先扩容。尾插法。hash 扰动函数优化：`(h = key.hashCode()) ^ (h >>> 16)`。
- **put 流程**：
  1. 计算 key 的 hash 值。
  2. 若 table 为空或长度为 0，则扩容（resize）。
  3. 根据 (n-1) & hash 计算索引，若该位置为空，直接插入。
  4. 若不为空，比较 key 是否相等（hash 和 equals），相等则覆盖。
  5. 否则判断是否为树节点，是则插入红黑树，否则遍历链表，尾插。遍历中若发现相同 key 则覆盖，否则在链表尾部插入新节点。插入后检查链表长度是否超过树化阈值（8），若超过则调用 `treeifyBin`（可能转为树也可能扩容）。
  6. 插入后检查 size 是否超过 threshold（容量 * 负载因子），超过则扩容。
- **扩容机制**：
  - 默认容量 16，负载因子 0.75。
  - 新容量 = 旧容量 * 2，新阈值 = 新容量 * 负载因子。
  - 元素重新分配：由于容量变为 2 倍，元素在新数组的索引要么在原来位置，要么在“原位置+旧容量”处（因为 hash 值不变，高位 bit 决定是 0 还是 1）。JDK 1.8 利用此特性优化，不需要重新计算 hash。
- **线程安全**：HashMap 非线程安全，并发下可能导致死循环（1.7）、数据丢失等。可用 `ConcurrentHashMap` 或 `Collections.synchronizedMap`。

#### LinkedHashMap
- 继承 `HashMap`，内部维护一个双向链表（before/after 指针）记录插入顺序或访问顺序（accessOrder）。
- 可用于实现 LRU 缓存（重写 `removeEldestEntry` 方法）。

#### TreeMap
- 基于红黑树，key 必须实现 `Comparable` 或传入 `Comparator`。保证 key 有序。方法如 `firstKey`、`lastKey`、`headMap`、`subMap` 等。

#### ConcurrentHashMap
- **JDK 1.7**：采用 Segment 分段锁，默认 16 个 Segment，每个 Segment 类似一个小 HashMap，继承 ReentrantLock。并发度 = Segment 数。
- **JDK 1.8**：放弃分段锁，采用 CAS + synchronized 对每个桶的首节点加锁。Node 数组 + 链表/红黑树。size 通过 CounterCell 累加。并发度更高。
- **重要方法**：`put` 时如果桶为空，CAS 插入；否则 synchronized 锁住首节点，再操作。`get` 无锁，依靠 volatile 保证可见性。

**面试题：**
- **Q：HashMap 和 Hashtable 的区别？**
  - Hashtable 线程安全（方法加 synchronized），不允许 null key/value；HashMap 非线程安全，允许一个 null key 和多个 null value。
  - 初始容量：Hashtable 11，负载因子 0.75；HashMap 16。
  - 扩容：Hashtable 翻倍+1；HashMap 翻倍。
  - 迭代器：HashMap 的 Iterator 是 fail-fast，Hashtable 的 Enumeration 不是。

- **Q：ConcurrentHashMap 的 size 方法如何实现？**
  - JDK 1.8 中，通过 baseCount 和 CounterCell 数组累加。先尝试 CAS 更新 baseCount，若竞争激烈则使用 CounterCell 分散计数，最后累加 baseCount 和各个 CounterCell 的值。

- **Q：HashMap 中当链表长度超过 8 为什么转为红黑树？**
  - 基于泊松分布，当负载因子 0.75 时，链表长度达到 8 的概率极低（约 0.00000006）。转为树是为了在极端 hash 冲突情况下，将查找性能从 O(n) 提升到 O(log n)。但树节点占用空间较大，所以用阈值平衡。

### 3.4 迭代器与 fail-fast

- **迭代器**：统一遍历集合的方式。`Iterator` 有 `hasNext()`、`next()`、`remove()`。`ListIterator` 支持双向遍历。
- **fail-fast 机制**：当集合在迭代过程中被结构修改（增删元素，不包括通过迭代器自身的 remove），会抛出 `ConcurrentModificationException`。原理：集合内部维护 `modCount` 变量，每次结构修改 +1；迭代器初始化时记录 `expectedModCount = modCount`，每次迭代检查是否相等。
- **安全失败（fail-safe）**：并发容器如 `CopyOnWriteArrayList`、`ConcurrentHashMap` 的迭代器是弱一致性，不会抛出 `ConcurrentModificationException`，因为它们迭代的是快照或 volatile 数组。

## 4. 泛型

### 4.1 类型擦除
- Java 泛型是编译时实现的，编译后泛型信息被擦除，替换为原始类型（Raw Type）或上界。如 `List<String>` 编译后变为 `List`（原始类型），并在必要处插入强制类型转换。
- 类型擦除导致的问题：
  - 不能使用基本类型作为泛型参数（需使用包装类）。
  - 不能创建泛型数组（如 `new T[]`），因为运行时类型未知，但可以通过 `(T[]) new Object[size]` 绕过。
  - 静态变量和静态方法中不能引用类的类型参数。
  - 无法通过反射获取泛型类型（但可以通过 ParameterizedType 获取字段或方法的泛型）。

### 4.2 通配符
- **上界通配符 `? extends T`**：表示类型是 T 或 T 的子类。用于读（生产者），可以读取元素（当作 T 类型），但不能写入（除了 null），因为不知道具体子类型。
- **下界通配符 `? super T`**：表示类型是 T 或 T 的超类。用于写（消费者），可以写入 T 类型或 null，读取时只能当作 Object。
- **PECS 原则**：Producer Extends, Consumer Super。

**常见面试题：**
- **Q：`List<Object>` 和 `List<?>` 的区别？**
  - `List<Object>` 明确表示列表元素是 Object 类型，可以添加任意对象。
  - `List<?>` 表示未知类型的列表，不能添加任何元素（除了 null），因为无法确定类型安全。通常用于只读场景。

- **Q：桥方法（Bridge Method）是什么？**
  - 当子类重写父类的泛型方法时，编译器会生成一个桥方法，保持多态。例如，父类 `void set(T t)`，子类重写 `void set(String s)`，编译器会生成一个桥方法 `void set(Object o)` 内部调用 `set((String)o)`，确保子类方法正确覆盖。

## 5. 反射

### 5.1 反射的核心 API
- 获取 Class 对象：`Class.forName("全类名")`、`类名.class`、`对象.getClass()`。
- 构造方法：`getConstructor()`、`getDeclaredConstructor()`，通过 `newInstance()` 创建对象。
- 字段：`getField()`（public 字段）、`getDeclaredField()`（所有字段），通过 `set()`、`get()` 访问，私有字段需 `setAccessible(true)`。
- 方法：`getMethod()`、`getDeclaredMethod()`，通过 `invoke()` 调用。

### 5.2 反射的性能与安全
- 反射调用比直接调用慢，因为涉及动态解析、类型检查。优化措施：缓存 Method 对象，使用 `setAccessible(true)` 跳过安全检查。
- 反射可以访问私有成员，破坏封装，但安全管理器可以限制。

### 5.3 应用场景
- Spring IoC：根据 XML 或注解创建 Bean，依赖注入。
- 动态代理：JDK 动态代理通过反射调用目标方法。
- 注解处理：运行时获取注解信息。
- 框架如 MyBatis：通过反射设置对象属性。

**面试题：**
- **Q：反射如何获取泛型类型？**
  - 如果字段、方法参数或返回值是泛型，可以通过 `Field.getGenericType()`、`Method.getGenericParameterTypes()` 获取 `Type`，如果是 `ParameterizedType`，可进一步获取实际类型参数。

## 6. 注解

### 6.1 元注解
- `@Retention`：注解保留策略，取值 `RetentionPolicy.SOURCE`（源码）、`CLASS`（字节码，默认）、`RUNTIME`（运行时可通过反射读取）。
- `@Target`：注解适用目标（如 METHOD、FIELD、TYPE、PARAMETER 等）。
- `@Inherited`：允许子类继承父类的注解（仅对类有效）。
- `@Documented`：包含在 JavaDoc 中。
- `@Repeatable`（Java 8）：允许注解在同一位置重复使用。

### 6.2 自定义注解
```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface MyAnnotation {
    String value() default "";
    int count() default 1;
}
```
使用：`@MyAnnotation(value = "test", count = 5)`

### 6.3 注解处理器
- **运行时处理**：通过反射获取注解，进行逻辑处理。
- **编译时处理**：通过 AbstractProcessor 继承，在编译期间生成代码（如 Lombok、ButterKnife）。利用 Java 的注解处理工具 APT。

**面试题：**
- **Q：`@Override` 注解的作用？**
  - 编译时检查方法是否正确地重写了父类方法。如果没有正确重写（如方法签名错误），编译报错。

## 7. Java 8+ 新特性

### 7.1 Lambda 表达式与函数式接口
- Lambda 语法：`(参数) -> { 方法体 }`。
- 函数式接口：只有一个抽象方法的接口（可以有默认方法和静态方法），用 `@FunctionalInterface` 标记。如 `Runnable`、`Comparator`、`Consumer<T>`、`Function<T,R>`、`Predicate<T>`、`Supplier<T>`。
- 方法引用：`类名::静态方法`、`实例::方法`、`类名::实例方法`、`构造方法::new`。

### 7.2 Stream API
- **流操作分类**：
  - **中间操作**：返回 Stream，惰性执行，如 `filter`、`map`、`flatMap`、`sorted`、`distinct`、`limit`、`skip`。
  - **终端操作**：触发计算并产生结果，如 `forEach`、`collect`、`count`、`reduce`、`anyMatch`、`findFirst`。
- **惰性求值**：只有在终端操作执行时才会开始计算，中间操作形成流水线。
- **并行流**：通过 `parallelStream()` 或 `parallel()` 将流转换为并行流，底层使用 ForkJoinPool 的公共线程池。注意线程安全和性能。
- **Collectors** 工具类：`toList()`、`toSet()`、`toMap()`、`groupingBy()`、`partitioningBy()`、`joining()`。

**常见面试题：**
- **Q：Stream 的 `map` 和 `flatMap` 区别？**
  - `map` 对每个元素应用函数，返回结果流，流中元素个数不变。
  - `flatMap` 将每个元素映射为一个流，然后将所有流连接成一个流，常用于处理嵌套集合或扁平化。

### 7.3 Optional
- 用于避免 NullPointerException，是容器对象，可能包含值，也可能为空。
- 常用方法：`of`（值不能为 null）、`ofNullable`（可为 null）、`orElse`、`orElseGet`、`orElseThrow`、`map`、`flatMap`、`filter`、`ifPresent`。
- 不推荐作为字段类型，也不推荐作为方法参数（序列化问题）。

### 7.4 新的日期时间 API
- **设计思想**：不可变、线程安全、清晰的方法名。
- **核心类**：
  - `LocalDate`：日期（年月日）。
  - `LocalTime`：时间（时分秒纳秒）。
  - `LocalDateTime`：日期+时间。
  - `Instant`：时间戳（从 1970-01-01T00:00:00Z 开始）。
  - `Duration`：时间间隔（秒/纳秒）。
  - `Period`：日期间隔（年月日）。
  - `DateTimeFormatter`：格式化与解析。
- 线程安全：旧 `SimpleDateFormat` 非线程安全，新 API 是线程安全的。

### 7.5 接口的默认方法与静态方法
- **默认方法**：接口中可以有方法体，用 `default` 修饰。用于在不破坏实现类的前提下给接口增加新方法。例如 `List` 接口的 `sort` 方法。
- **静态方法**：接口中可以有静态方法，如 `Comparator.comparing`。用于提供工具方法。
- **多继承冲突解决**：如果类同时实现两个接口，且都有相同的默认方法，类必须重写该方法；如果类继承父类和实现接口，父类的方法优先。

### 7.6 CompletableFuture
（可选，但属于 Java 8 重要特性，可归入并发）
- 实现异步编程，组合多个 Future。
- 常用方法：`supplyAsync`、`thenApply`、`thenAccept`、`thenCompose`、`thenCombine`、`allOf`、`anyOf` 等。

## 8. 其他基础

### 8.1 String 相关
- **String 不可变性**：String 类被 `final` 修饰，字符数组 `value` 也是 `final`，任何修改都返回新对象。好处：常量池共享、线程安全、hash 值缓存。
- **String 常量池**：JDK 1.7 后移到堆中。通过字面量赋值时，先从常量池查找，存在则直接引用，不存在则创建并放入池。`intern()` 方法可将字符串对象手动加入常量池。
- **StringBuilder 与 StringBuffer**：StringBuilder 非线程安全（JDK 1.5），StringBuffer 线程安全（方法加 synchronized），底层都是可变字符数组，初始容量 16，扩容时翻倍并复制数组。

**面试题：**
- **Q：`String s = new String("abc")` 创建了几个对象？**
  - 如果常量池已有 "abc"，则只创建一个堆中的对象；如果常量池没有，则创建两个对象：常量池中的 "abc" 和堆中的对象。

### 8.2 基本类型与包装类型
- **自动装箱/拆箱**：编译器自动调用 `valueOf` 和 `xxxValue` 方法。例如 `Integer i = 10` 等价于 `Integer i = Integer.valueOf(10)`。
- **包装类型缓存池**：
  - Boolean：全部缓存。
  - Byte/Short/Integer/Long：缓存 [-128, 127] 范围内的值。
  - Character：缓存 [0, 127]。
  - Float/Double：无缓存。
- 注意：通过 `new` 创建的对象不会使用缓存池。

### 8.3 equals 与 hashCode
- **约定**：
  1. 如果两个对象 equals 相等，则 hashCode 必须相等。
  2. 如果两个对象 hashCode 相等，equals 不一定相等（哈希冲突）。
- **为什么重写 equals 必须重写 hashCode？**
  - 为了确保在哈希集合（HashSet/HashMap）中正确工作。若只重写 equals 而 hashCode 不同，相同对象可能被放入不同桶，导致集合中出现重复元素。
- **重写规则**：
  - equals 需满足自反性、对称性、传递性、一致性，且非 null 对象调用 equals(null) 返回 false。
  - hashCode 一般用对象的字段计算，如 `Objects.hash(field1, field2)`。

### 8.4 关键字
- **final**：
  - 修饰类：不可被继承。
  - 修饰方法：不可被重写（但可以被重载）。
  - 修饰变量：基本类型值不可变，引用类型引用不可变（但对象内容可变）。
- **static**：
  - 修饰成员变量：属于类，所有实例共享。
  - 修饰方法：类方法，不能访问非静态成员。
  - 静态代码块：类加载时执行，用于初始化。
- **transient**：修饰字段，表示该字段不参与序列化。反序列化后恢复为默认值。
- **volatile**（见并发部分）：保证可见性和禁止重排序，不保证原子性。

---

以上是 Java 基础部分的详细面试资料，涵盖了核心概念、原理和常见问题。面试时不仅要会背答案，更要理解背后的设计思想和应用场景，结合项目经历进行阐述。