# 模块五：MySQL 深度剖析 ⭐

> 存储层核心，P6/P7 必须掌握索引原理、事务机制和调优实战

---

## 1. InnoDB 存储引擎架构

### 1.1 整体架构

```
InnoDB 架构
├── 内存结构
│   ├── Buffer Pool（缓冲池）
│   │   ├── 数据页（Data Page）
│   │   ├── 索引页（Index Page）
│   │   ├── 插入缓冲（Insert Buffer）
│   │   ├── 自适应哈希索引（Adaptive Hash Index）
│   │   └── 锁信息、数据字典
│   ├── Change Buffer（写缓冲，原 Insert Buffer）
│   ├── Log Buffer（日志缓冲）
│   └── Adaptive Hash Index
└── 磁盘结构
    ├── 表空间（Tablespace）
    │   ├── 系统表空间（ibdata1）
    │   └── 独立表空间（.ibd 文件）
    ├── Redo Log（重做日志，ib_logfile0/1）
    ├── Undo Log（回滚日志）
    └── Doublewrite Buffer（双写缓冲）
```

### 1.2 Buffer Pool

Buffer Pool 是 InnoDB 最重要的内存结构，缓存磁盘数据页，减少磁盘 IO。

```sql
-- 查看 Buffer Pool 状态
SHOW ENGINE INNODB STATUS\G
SHOW VARIABLES LIKE 'innodb_buffer_pool%';

-- 关键参数
innodb_buffer_pool_size = 4G        -- 建议设为物理内存的 60%~80%
innodb_buffer_pool_instances = 8    -- 多实例减少锁竞争（每个实例 >= 1GB）
```

**LRU 改进版**：Buffer Pool 使用改进的 LRU 算法，分为 young 区（5/8）和 old 区（3/8），新读入的页先放 old 区头部，避免全表扫描污染热数据。

### 1.3 Redo Log vs Undo Log vs Binlog

| 日志 | 类型 | 作用 | 写入时机 |
|------|------|------|----------|
| Redo Log | InnoDB 物理日志 | 崩溃恢复（保证持久性） | 事务执行中 |
| Undo Log | InnoDB 逻辑日志 | 事务回滚、MVCC | 事务执行中 |
| Binlog | Server 层逻辑日志 | 主从复制、数据恢复 | 事务提交时 |

**两阶段提交（2PC）**：保证 Redo Log 和 Binlog 的一致性

```
写 Redo Log（prepare 状态）
    ↓
写 Binlog
    ↓
写 Redo Log（commit 状态）
```

---

## 2. 索引原理 ⭐

### 2.1 B+树结构

```
B+树特点：
1. 所有数据存储在叶子节点
2. 叶子节点通过双向链表连接（支持范围查询）
3. 非叶子节点只存储键值（索引），不存储数据
4. 树高通常为 3~4 层（千万级数据）

高度计算：
- 每个页 16KB，主键 bigint(8字节) + 指针(6字节) = 14字节
- 非叶子节点可存 16384/14 ≈ 1170 个键值
- 叶子节点存数据行，假设每行 1KB，可存 16 行
- 3层 B+树：1170 * 1170 * 16 ≈ 2190万行
```

### 2.2 聚簇索引 vs 非聚簇索引

**聚簇索引（主键索引）**：
- 叶子节点存储完整行数据
- 每张表只有一个聚簇索引
- 主键选择：建议使用自增整数（避免页分裂）

**非聚簇索引（二级索引）**：
- 叶子节点存储主键值（而非完整行数据）
- 查询时需要**回表**（通过主键再查聚簇索引）

```sql
-- 回表示例
SELECT * FROM users WHERE name = '张三';
-- 1. 在 name 索引上找到 name='张三' 的主键 id
-- 2. 用 id 在聚簇索引上查找完整行数据（回表）
```

### 2.3 覆盖索引

```sql
-- 覆盖索引：查询的列都在索引中，无需回表
CREATE INDEX idx_name_age ON users(name, age);

-- 覆盖索引（无需回表）
SELECT name, age FROM users WHERE name = '张三';
-- EXPLAIN 中 Extra 列显示 "Using index"

-- 需要回表
SELECT * FROM users WHERE name = '张三';
```

### 2.4 联合索引与最左前缀原则

```sql
CREATE INDEX idx_a_b_c ON t(a, b, c);

-- 能用索引
WHERE a = 1                    -- 用 a
WHERE a = 1 AND b = 2          -- 用 a, b
WHERE a = 1 AND b = 2 AND c = 3 -- 用 a, b, c
WHERE a = 1 AND c = 3          -- 只用 a（b 断了，c 不能用）
WHERE a > 1 AND b = 2          -- 只用 a（范围查询后的列不能用）

-- 不能用索引
WHERE b = 2                    -- 没有 a，不满足最左前缀
WHERE b = 2 AND c = 3          -- 同上
```

### 2.5 索引下推（ICP）

```sql
-- 没有索引下推（MySQL 5.6 之前）
-- 1. 存储引擎根据 name 找到所有匹配行，返回给 Server 层
-- 2. Server 层再过滤 age 条件
SELECT * FROM users WHERE name LIKE '张%' AND age = 25;

-- 有索引下推（MySQL 5.6+）
-- 1. 存储引擎在索引层同时过滤 name 和 age
-- 2. 减少回表次数
-- EXPLAIN 中 Extra 列显示 "Using index condition"
```

### 2.6 ⭐ 索引失效场景

```sql
-- 1. 对索引列使用函数
WHERE YEAR(create_time) = 2024  -- 失效
WHERE create_time >= '2024-01-01' AND create_time < '2025-01-01'  -- 有效

-- 2. 隐式类型转换
-- phone 是 varchar，传入数字会触发隐式转换
WHERE phone = 13800138000  -- 失效（varchar 转 int）
WHERE phone = '13800138000'  -- 有效

-- 3. 前缀模糊查询
WHERE name LIKE '%张'   -- 失效（前缀通配符）
WHERE name LIKE '张%'   -- 有效

-- 4. OR 条件（OR 两侧都要有索引才能用）
WHERE name = '张三' OR age = 25  -- age 无索引则失效

-- 5. NOT IN / NOT EXISTS（可能失效，取决于数据分布）
-- 6. 索引列参与计算
WHERE id + 1 = 10  -- 失效
WHERE id = 9       -- 有效
```

---

## 3. 事务 ACID 与隔离级别

### 3.1 ACID 特性

| 特性 | 说明 | 实现机制 |
|------|------|----------|
| 原子性（Atomicity） | 事务要么全成功，要么全回滚 | Undo Log |
| 一致性（Consistency） | 事务前后数据库处于合法状态 | 其他三个特性共同保证 |
| 隔离性（Isolation） | 并发事务互不干扰 | 锁 + MVCC |
| 持久性（Durability） | 提交后数据永久保存 | Redo Log |

### 3.2 隔离级别

| 隔离级别 | 脏读 | 不可重复读 | 幻读 |
|----------|------|-----------|------|
| READ UNCOMMITTED | ✓ | ✓ | ✓ |
| READ COMMITTED | ✗ | ✓ | ✓ |
| REPEATABLE READ（默认） | ✗ | ✗ | 基本解决 |
| SERIALIZABLE | ✗ | ✗ | ✗ |

> **注意**：InnoDB 在 REPEATABLE READ 下通过 MVCC + 间隙锁基本解决了幻读，但不是完全解决（当前读仍可能幻读）。

---

## 4. MVCC 实现原理 ⭐

### 4.1 核心组件

**隐藏字段**：每行数据有三个隐藏字段：
- `DB_TRX_ID`：最近修改该行的事务 ID
- `DB_ROLL_PTR`：指向 Undo Log 的回滚指针
- `DB_ROW_ID`：隐式主键（无主键时使用）

**Undo Log 版本链**：

```
当前行数据（trx_id=100）
    ↓ roll_ptr
Undo Log（trx_id=80）
    ↓ roll_ptr
Undo Log（trx_id=60）
    ↓ roll_ptr
Undo Log（trx_id=40）
```

**Read View（快照）**：

```java
// Read View 结构
class ReadView {
    long creatorTrxId;      // 创建该 Read View 的事务 ID
    long[] activeTrxIds;    // 创建时活跃的事务 ID 列表
    long minTrxId;          // 活跃事务中最小的 ID
    long maxTrxId;          // 下一个将分配的事务 ID
}
```

### 4.2 可见性判断规则

对于版本链中的某个版本（trx_id）：

```
1. trx_id == creatorTrxId → 可见（自己修改的）
2. trx_id < minTrxId → 可见（已提交的旧事务）
3. trx_id >= maxTrxId → 不可见（未来的事务）
4. minTrxId <= trx_id < maxTrxId：
   - trx_id 在 activeTrxIds 中 → 不可见（活跃未提交）
   - trx_id 不在 activeTrxIds 中 → 可见（已提交）
```

### 4.3 RC vs RR 的区别

```
READ COMMITTED：每次快照读都创建新的 Read View
    → 能读到其他事务已提交的最新数据（不可重复读）

REPEATABLE READ：事务开始时创建 Read View，整个事务复用
    → 同一事务内多次读取结果一致（可重复读）
```

---

## 5. 锁机制 ⭐

### 5.1 锁分类

```
按粒度：
├── 表锁（Table Lock）：开销小，并发低
├── 行锁（Row Lock）：开销大，并发高（InnoDB 默认）
└── 页锁（Page Lock）：BDB 引擎

按类型：
├── 共享锁（S Lock）：读锁，多个事务可同时持有
└── 排他锁（X Lock）：写锁，独占

InnoDB 行锁类型：
├── Record Lock：锁定单行记录
├── Gap Lock：锁定索引间隙（不含记录本身）
└── Next-Key Lock：Record Lock + Gap Lock（默认）
```

### 5.2 间隙锁与幻读

```sql
-- 表数据：id = 1, 5, 10, 15, 20
-- 事务 A
BEGIN;
SELECT * FROM t WHERE id BETWEEN 5 AND 15 FOR UPDATE;
-- 加 Next-Key Lock：(1,5], (5,10], (10,15]
-- 间隙锁：(1,5), (5,10), (10,15)

-- 事务 B（被阻塞）
INSERT INTO t VALUES (7, ...);  -- 被间隙锁 (5,10) 阻塞
INSERT INTO t VALUES (12, ...); -- 被间隙锁 (10,15) 阻塞
```

**间隙锁加锁规则**（重要）：
1. 加锁基本单位是 Next-Key Lock（左开右闭区间）
2. 查询过程中访问到的对象才会加锁
3. 索引上的等值查询，唯一索引加锁时 Next-Key Lock 退化为 Record Lock
4. 索引上的等值查询，向右遍历时最后一个值不满足等值条件，Next-Key Lock 退化为 Gap Lock

### 5.3 死锁

```sql
-- 死锁示例
-- 事务 A：UPDATE t SET v=1 WHERE id=1; UPDATE t SET v=1 WHERE id=2;
-- 事务 B：UPDATE t SET v=1 WHERE id=2; UPDATE t SET v=1 WHERE id=1;

-- 查看死锁日志
SHOW ENGINE INNODB STATUS\G
-- 或开启死锁日志
SET GLOBAL innodb_print_all_deadlocks = ON;

-- 死锁预防
-- 1. 固定加锁顺序
-- 2. 减少事务持锁时间
-- 3. 使用 SELECT ... FOR UPDATE 提前加锁
-- 4. 降低隔离级别（RC 无间隙锁）
```

---

## 6. SQL 执行计划分析与优化

### 6.1 EXPLAIN 详解

```sql
EXPLAIN SELECT * FROM users WHERE name = '张三' AND age > 20;

-- 关键字段
id          -- 查询序号，相同则从上到下执行，不同则大的先执行
select_type -- SIMPLE/PRIMARY/SUBQUERY/UNION
table       -- 表名
type        -- 访问类型（重要！）
possible_keys -- 可能用到的索引
key         -- 实际用到的索引
key_len     -- 索引使用的字节数（越小越好，但要覆盖条件）
ref         -- 与索引比较的列
rows        -- 预估扫描行数
filtered    -- 过滤后行数占比
Extra       -- 额外信息（重要！）
```

**type 字段（从好到差）**：

| type | 说明 | 示例 |
|------|------|------|
| `system` | 表只有一行 | 系统表 |
| `const` | 主键/唯一索引等值查询 | `WHERE id = 1` |
| `eq_ref` | 联表时主键/唯一索引 | JOIN 时 |
| `ref` | 非唯一索引等值查询 | `WHERE name = '张三'` |
| `range` | 索引范围查询 | `WHERE id > 10` |
| `index` | 全索引扫描 | 覆盖索引但全扫 |
| `ALL` | 全表扫描 | 无索引 |

**Extra 字段**：

| Extra | 说明 |
|-------|------|
| `Using index` | 覆盖索引，无需回表 ✅ |
| `Using where` | Server 层过滤 |
| `Using index condition` | 索引下推 ✅ |
| `Using filesort` | 文件排序（需优化）⚠️ |
| `Using temporary` | 使用临时表（需优化）⚠️ |
| `Using join buffer` | 联表时无索引 ⚠️ |

### 6.2 慢查询优化实战

```sql
-- 开启慢查询日志
SET GLOBAL slow_query_log = ON;
SET GLOBAL long_query_time = 1;  -- 超过1秒记录
SET GLOBAL slow_query_log_file = '/var/log/mysql/slow.log';

-- 分析慢查询日志
mysqldumpslow -s t -t 10 /var/log/mysql/slow.log  # 按时间排序，取前10

-- 优化案例1：全表扫描
-- 原始：SELECT * FROM orders WHERE status = 1 AND create_time > '2024-01-01'
-- 优化：CREATE INDEX idx_status_time ON orders(status, create_time);

-- 优化案例2：ORDER BY 导致 filesort
-- 原始：SELECT * FROM orders WHERE user_id = 1 ORDER BY create_time DESC
-- 优化：CREATE INDEX idx_user_time ON orders(user_id, create_time);
-- 联合索引同时满足 WHERE 和 ORDER BY，避免 filesort

-- 优化案例3：深分页
-- 原始：SELECT * FROM orders LIMIT 1000000, 10  -- 扫描100万行
-- 优化：SELECT * FROM orders WHERE id > 1000000 LIMIT 10  -- 游标分页
-- 或：SELECT o.* FROM orders o JOIN (SELECT id FROM orders LIMIT 1000000, 10) t ON o.id = t.id
```

---

## 7. 分库分表方案设计

### 7.1 分库分表策略

**垂直分库**：按业务模块拆分，将不同业务的表放到不同数据库

**垂直分表**：将宽表拆分为多个窄表（冷热数据分离）

**水平分库**：同一张表的数据按规则分散到多个数据库

**水平分表**：同一张表的数据按规则分散到多个表

### 7.2 分片键选择

```
分片键选择原则：
1. 高频查询条件（避免跨分片查询）
2. 数据分布均匀（避免热点）
3. 不可变（避免数据迁移）

常用分片算法：
- 取模：hash(key) % N，数据均匀，扩容需迁移数据
- 范围：按时间/ID范围，扩容方便，可能热点
- 一致性哈希：扩容时只迁移少量数据
- 雪花算法：生成全局唯一 ID，包含时间戳+机器ID+序列号
```

### 7.3 分库分表问题

```
常见问题及解决方案：

1. 跨分片查询
   - 避免：设计时尽量让查询在单分片内完成
   - 解决：应用层聚合、ES 搜索引擎

2. 分布式事务
   - 解决：TCC、Saga、本地消息表

3. 全局唯一 ID
   - 解决：雪花算法、数据库号段模式、Redis 自增

4. 分页查询
   - 解决：禁止跳页（游标分页）、ES 搜索

5. 跨分片排序/聚合
   - 解决：应用层归并排序、ES 聚合
```

---

## 8. 主从复制与读写分离

### 8.1 主从复制原理

```
主库（Master）                    从库（Slave）
    ↓ 写操作                          ↑
    ↓ 写 Binlog                       ↑
    ↓                                 ↑
    ← IO Thread 拉取 Binlog ←←←←←←←←←
                                      ↓
                                  写 Relay Log
                                      ↓
                                  SQL Thread 重放
                                      ↓
                                  从库数据更新
```

**复制模式**：

| 模式 | 说明 | 数据安全 | 性能 |
|------|------|----------|------|
| 异步复制（默认） | 主库不等从库确认 | 低（可能丢数据） | 高 |
| 半同步复制 | 至少一个从库确认 | 中 | 中 |
| 全同步复制 | 所有从库确认 | 高 | 低 |
| GTID 复制 | 基于全局事务ID | 高 | 中 |

### 8.2 主从延迟问题

```sql
-- 查看主从延迟
SHOW SLAVE STATUS\G
-- Seconds_Behind_Master: 延迟秒数

-- 延迟原因：
-- 1. 从库单线程重放（MySQL 5.6+ 支持并行复制）
-- 2. 大事务（长时间持锁）
-- 3. 从库机器性能差

-- 解决方案：
-- 1. 并行复制：slave_parallel_workers > 0
-- 2. 读写分离时，写后读走主库（强制路由）
-- 3. 半同步复制保证数据一致性
```

---

## 高频面试真题

### Q1：B+树索引的原理？为什么不用 B 树或哈希？

**答题框架**：
- B+树：非叶子节点只存键值，叶子节点存数据且双向链表连接，支持范围查询
- vs B 树：B 树非叶子节点也存数据，导致每页存储的键值少，树更高；不支持范围查询
- vs 哈希：哈希只支持等值查询，不支持范围查询、排序、前缀匹配

### Q2：MVCC 的实现原理？

**答题框架**：
- 三个核心：隐藏字段（trx_id/roll_ptr）+ Undo Log 版本链 + Read View
- RC：每次快照读创建新 Read View，能读到已提交的最新数据
- RR：事务开始时创建 Read View，整个事务复用，保证可重复读
- 可见性判断：比较 trx_id 与 Read View 的 minTrxId/maxTrxId/activeTrxIds

### Q3：间隙锁是什么？如何解决幻读？

**答题框架**：
- 间隙锁：锁定索引记录之间的间隙，防止其他事务在间隙中插入数据
- Next-Key Lock = Record Lock + Gap Lock，是 InnoDB 默认的行锁
- 解决幻读：当前读（SELECT FOR UPDATE）通过 Next-Key Lock 防止幻读；快照读通过 MVCC 防止幻读
- 注意：RC 隔离级别下没有间隙锁，并发更高但有幻读风险

### Q4：如何优化一条慢 SQL？

**答题框架**：
1. EXPLAIN 分析执行计划，关注 type（是否全表扫描）、Extra（filesort/temporary）
2. 检查索引：是否缺少索引、索引是否失效（函数/类型转换/前缀通配符）
3. 优化 SQL：避免 SELECT *、减少子查询、优化 JOIN 顺序
4. 优化索引：创建联合索引覆盖查询条件和排序字段
5. 深分页优化：游标分页或延迟关联

### Q5：分库分表后如何处理跨分片查询？

**答题框架**：
- 设计阶段：选择合适的分片键，让高频查询在单分片内完成
- 全局表：字典表等小表在每个分片都保存一份
- 应用层聚合：各分片查询后在应用层合并排序
- 搜索引擎：复杂查询走 ES，ES 中存储分片键用于回查 MySQL
- 避免：禁止不带分片键的全分片扫描

---

## 学习建议

**备考重点**：B+树索引原理（必考）、MVCC 实现（必考）、间隙锁（必考）、EXPLAIN 分析（必考）、慢查询优化（必考）

**推荐资源**：
- 《MySQL 技术内幕：InnoDB 存储引擎》（姜承尧）
- 《高性能 MySQL》第 4 版
- MySQL 官方文档：InnoDB 存储引擎章节
- 极客时间《MySQL 实战 45 讲》（林晓斌）
