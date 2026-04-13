# 模块三：数据结构与算法

> 面向资深工程师，重点在集合底层实现与高频算法题型

---

## 1. HashMap / LinkedHashMap / TreeMap 底层实现对比 ⭐

### 1.1 HashMap（JDK 8）

**数据结构**：数组 + 链表 + 红黑树

```java
// 核心字段
transient Node<K,V>[] table;      // 哈希桶数组
transient int size;                // 元素数量
int threshold;                     // 扩容阈值 = capacity * loadFactor
final float loadFactor;            // 负载因子，默认 0.75

// Node 结构
static class Node<K,V> {
    final int hash;
    final K key;
    V value;
    Node<K,V> next;  // 链表
}

// TreeNode 结构（红黑树节点）
static final class TreeNode<K,V> extends LinkedHashMap.Entry<K,V> {
    TreeNode<K,V> parent, left, right, prev;
    boolean red;
}
```

**put 流程**：

```
1. 计算 hash：(key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16)
   （高16位与低16位异或，减少碰撞）
2. 确定桶位置：(n - 1) & hash（n 为数组长度，必须是2的幂）
3. 桶为空：直接插入
4. 桶不为空：
   - key 相同：覆盖 value
   - 链表：遍历，尾插法（JDK 8，JDK 7 是头插法）
   - 红黑树：树插入
5. 链表长度 >= 8 且数组长度 >= 64：链表转红黑树
6. 元素数量 > threshold：扩容（2倍）
```

**扩容机制**：

```java
// 扩容时重新计算桶位置
// 由于容量是2的幂，扩容后 hash & newCap-1
// 新位置 = 原位置 或 原位置 + 旧容量
// 通过 (e.hash & oldCap) == 0 判断：
//   == 0：留在原位置
//   != 0：移到 原位置 + oldCap
```

**⭐ 常见面试问题**：

```java
// 为什么容量必须是2的幂？
// 答：(n-1) & hash 等价于 hash % n，但位运算更快
// 且扩容时可以用位运算快速判断新位置

// 为什么负载因子是 0.75？
// 答：空间与时间的权衡。太小（如0.5）浪费空间；太大（如1.0）碰撞多，查询慢
// 0.75 是泊松分布下碰撞概率最优的经验值

// 为什么链表长度 >= 8 才转红黑树？
// 答：泊松分布，链表长度达到8的概率约为 0.00000006，极少发生
// 红黑树节点占用空间是链表节点的2倍，转换有成本

// JDK 7 头插法为什么在并发下会死循环？
// 答：多线程同时扩容时，头插法会导致链表反转，形成环形链表
// JDK 8 改为尾插法，但 HashMap 仍然不是线程安全的
```

### 1.2 LinkedHashMap

**数据结构**：继承 HashMap + 双向链表（维护插入/访问顺序）

```java
// 额外字段
transient LinkedHashMap.Entry<K,V> head;  // 链表头（最老）
transient LinkedHashMap.Entry<K,V> tail;  // 链表尾（最新）
final boolean accessOrder;  // false=插入顺序，true=访问顺序

// Entry 继承 HashMap.Node，增加 before/after 指针
static class Entry<K,V> extends HashMap.Node<K,V> {
    Entry<K,V> before, after;
}
```

**LRU 缓存实现**：

```java
// 利用 LinkedHashMap 实现 LRU
public class LRUCache<K, V> extends LinkedHashMap<K, V> {
    private final int capacity;
    
    public LRUCache(int capacity) {
        super(capacity, 0.75f, true);  // accessOrder=true
        this.capacity = capacity;
    }
    
    @Override
    protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        return size() > capacity;  // 超出容量时删除最老元素
    }
}
```

### 1.3 TreeMap

**数据结构**：红黑树（自平衡二叉搜索树）

```java
// 特点：按 key 排序（自然顺序或自定义 Comparator）
TreeMap<String, Integer> map = new TreeMap<>(Comparator.reverseOrder());

// 特有操作
map.firstKey();                    // 最小 key
map.lastKey();                     // 最大 key
map.floorKey("c");                 // <= "c" 的最大 key
map.ceilingKey("c");               // >= "c" 的最小 key
map.subMap("a", "d");              // [a, d) 范围
map.headMap("c");                  // < "c" 的部分
map.tailMap("c");                  // >= "c" 的部分
```

### 1.4 三者对比

| 维度 | HashMap | LinkedHashMap | TreeMap |
|------|---------|---------------|---------|
| 数据结构 | 数组+链表+红黑树 | HashMap+双向链表 | 红黑树 |
| 有序性 | 无序 | 插入/访问顺序 | key 排序 |
| null key | 允许（1个） | 允许（1个） | 不允许 |
| 时间复杂度 | O(1) 均摊 | O(1) 均摊 | O(log n) |
| 线程安全 | 否 | 否 | 否 |
| 适用场景 | 通用 | LRU 缓存 | 范围查询、排序 |

---

## 2. 常用数据结构

### 2.1 堆（优先队列）

```java
// 最小堆（默认）
PriorityQueue<Integer> minHeap = new PriorityQueue<>();

// 最大堆
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Comparator.reverseOrder());

// 自定义对象
PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[1] - b[1]);

// 常用操作
pq.offer(val);   // 入堆 O(log n)
pq.poll();       // 出堆（最小/最大值）O(log n)
pq.peek();       // 查看堆顶 O(1)
```

**应用场景**：Top K 问题、合并 K 个有序链表、任务调度

### 2.2 单调栈

```java
// 单调递减栈：找下一个更大元素
int[] nextGreater(int[] nums) {
    int n = nums.length;
    int[] result = new int[n];
    Arrays.fill(result, -1);
    Deque<Integer> stack = new ArrayDeque<>();  // 存索引
    
    for (int i = 0; i < n; i++) {
        while (!stack.isEmpty() && nums[stack.peek()] < nums[i]) {
            result[stack.pop()] = nums[i];
        }
        stack.push(i);
    }
    return result;
}
```

### 2.3 并查集

```java
class UnionFind {
    int[] parent, rank;
    
    UnionFind(int n) {
        parent = new int[n];
        rank = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
    }
    
    int find(int x) {
        if (parent[x] != x) parent[x] = find(parent[x]);  // 路径压缩
        return parent[x];
    }
    
    void union(int x, int y) {
        int px = find(x), py = find(y);
        if (px == py) return;
        if (rank[px] < rank[py]) { int t = px; px = py; py = t; }
        parent[py] = px;
        if (rank[px] == rank[py]) rank[px]++;
    }
    
    boolean connected(int x, int y) {
        return find(x) == find(y);
    }
}
```

---

## 3. 高频算法题分类

### 3.1 排序算法

```java
// 快速排序（平均 O(n log n)，最坏 O(n²)）
void quickSort(int[] arr, int left, int right) {
    if (left >= right) return;
    int pivot = partition(arr, left, right);
    quickSort(arr, left, pivot - 1);
    quickSort(arr, pivot + 1, right);
}

int partition(int[] arr, int left, int right) {
    int pivot = arr[right];
    int i = left - 1;
    for (int j = left; j < right; j++) {
        if (arr[j] <= pivot) {
            swap(arr, ++i, j);
        }
    }
    swap(arr, i + 1, right);
    return i + 1;
}

// 归并排序（稳定，O(n log n)）
void mergeSort(int[] arr, int left, int right) {
    if (left >= right) return;
    int mid = left + (right - left) / 2;
    mergeSort(arr, left, mid);
    mergeSort(arr, mid + 1, right);
    merge(arr, left, mid, right);
}

void merge(int[] arr, int left, int mid, int right) {
    int[] temp = Arrays.copyOfRange(arr, left, right + 1);
    int i = 0, j = mid - left + 1, k = left;
    while (i <= mid - left && j <= right - left) {
        arr[k++] = temp[i] <= temp[j] ? temp[i++] : temp[j++];
    }
    while (i <= mid - left) arr[k++] = temp[i++];
    while (j <= right - left) arr[k++] = temp[j++];
}
```

**排序算法对比**：

| 算法 | 时间（平均） | 时间（最坏） | 空间 | 稳定 |
|------|------------|------------|------|------|
| 冒泡 | O(n²) | O(n²) | O(1) | 是 |
| 选择 | O(n²) | O(n²) | O(1) | 否 |
| 插入 | O(n²) | O(n²) | O(1) | 是 |
| 快排 | O(n log n) | O(n²) | O(log n) | 否 |
| 归并 | O(n log n) | O(n log n) | O(n) | 是 |
| 堆排 | O(n log n) | O(n log n) | O(1) | 否 |
| 计数 | O(n+k) | O(n+k) | O(k) | 是 |

### 3.2 二分查找

```java
// 标准二分
int binarySearch(int[] nums, int target) {
    int left = 0, right = nums.length - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;  // 防止溢出
        if (nums[mid] == target) return mid;
        else if (nums[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}

// 找左边界（第一个 >= target 的位置）
int lowerBound(int[] nums, int target) {
    int left = 0, right = nums.length;
    while (left < right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] < target) left = mid + 1;
        else right = mid;
    }
    return left;
}

// 找右边界（最后一个 <= target 的位置）
int upperBound(int[] nums, int target) {
    int left = 0, right = nums.length;
    while (left < right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] <= target) left = mid + 1;
        else right = mid;
    }
    return left - 1;
}
```

### 3.3 动态规划

**解题框架**：
1. 定义状态：`dp[i]` 表示什么
2. 状态转移方程
3. 初始化边界
4. 遍历顺序

```java
// 经典：最长递增子序列（LIS）O(n log n)
int lengthOfLIS(int[] nums) {
    List<Integer> tails = new ArrayList<>();
    for (int num : nums) {
        int pos = lowerBound(tails, num);
        if (pos == tails.size()) tails.add(num);
        else tails.set(pos, num);
    }
    return tails.size();
}

// 经典：0-1 背包
int knapsack(int[] weights, int[] values, int capacity) {
    int n = weights.length;
    int[] dp = new int[capacity + 1];
    for (int i = 0; i < n; i++) {
        for (int j = capacity; j >= weights[i]; j--) {  // 逆序防止重复选
            dp[j] = Math.max(dp[j], dp[j - weights[i]] + values[i]);
        }
    }
    return dp[capacity];
}

// 经典：最长公共子序列（LCS）
int longestCommonSubsequence(String text1, String text2) {
    int m = text1.length(), n = text2.length();
    int[][] dp = new int[m + 1][n + 1];
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (text1.charAt(i-1) == text2.charAt(j-1))
                dp[i][j] = dp[i-1][j-1] + 1;
            else
                dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]);
        }
    }
    return dp[m][n];
}
```

### 3.4 滑动窗口

```java
// 模板：最小覆盖子串
String minWindow(String s, String t) {
    Map<Character, Integer> need = new HashMap<>();
    for (char c : t.toCharArray()) need.merge(c, 1, Integer::sum);
    
    int left = 0, right = 0, valid = 0;
    int start = 0, minLen = Integer.MAX_VALUE;
    Map<Character, Integer> window = new HashMap<>();
    
    while (right < s.length()) {
        char c = s.charAt(right++);
        if (need.containsKey(c)) {
            window.merge(c, 1, Integer::sum);
            if (window.get(c).equals(need.get(c))) valid++;
        }
        
        while (valid == need.size()) {
            if (right - left < minLen) {
                start = left;
                minLen = right - left;
            }
            char d = s.charAt(left++);
            if (need.containsKey(d)) {
                if (window.get(d).equals(need.get(d))) valid--;
                window.merge(d, -1, Integer::sum);
            }
        }
    }
    return minLen == Integer.MAX_VALUE ? "" : s.substring(start, start + minLen);
}
```

### 3.5 回溯算法

```java
// 模板：全排列
List<List<Integer>> permute(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    backtrack(nums, new boolean[nums.length], new ArrayList<>(), result);
    return result;
}

void backtrack(int[] nums, boolean[] used, List<Integer> path, 
               List<List<Integer>> result) {
    if (path.size() == nums.length) {
        result.add(new ArrayList<>(path));
        return;
    }
    for (int i = 0; i < nums.length; i++) {
        if (used[i]) continue;
        used[i] = true;
        path.add(nums[i]);
        backtrack(nums, used, path, result);
        path.remove(path.size() - 1);  // 撤销选择
        used[i] = false;
    }
}
```

### 3.6 图算法

```java
// BFS（最短路径）
int bfs(int[][] grid, int[] start, int[] end) {
    int[][] dirs = {{0,1},{0,-1},{1,0},{-1,0}};
    Queue<int[]> queue = new LinkedList<>();
    queue.offer(start);
    boolean[][] visited = new boolean[grid.length][grid[0].length];
    visited[start[0]][start[1]] = true;
    int steps = 0;
    
    while (!queue.isEmpty()) {
        int size = queue.size();
        for (int i = 0; i < size; i++) {
            int[] cur = queue.poll();
            if (cur[0] == end[0] && cur[1] == end[1]) return steps;
            for (int[] dir : dirs) {
                int nx = cur[0] + dir[0], ny = cur[1] + dir[1];
                if (nx >= 0 && nx < grid.length && ny >= 0 && ny < grid[0].length
                    && !visited[nx][ny] && grid[nx][ny] == 0) {
                    visited[nx][ny] = true;
                    queue.offer(new int[]{nx, ny});
                }
            }
        }
        steps++;
    }
    return -1;
}

// Dijkstra（带权最短路径）
int[] dijkstra(int[][] graph, int src) {
    int n = graph.length;
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[src] = 0;
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[1] - b[1]);
    pq.offer(new int[]{src, 0});
    
    while (!pq.isEmpty()) {
        int[] cur = pq.poll();
        int u = cur[0], d = cur[1];
        if (d > dist[u]) continue;
        for (int v = 0; v < n; v++) {
            if (graph[u][v] > 0 && dist[u] + graph[u][v] < dist[v]) {
                dist[v] = dist[u] + graph[u][v];
                pq.offer(new int[]{v, dist[v]});
            }
        }
    }
    return dist;
}
```

---

## 4. 时间/空间复杂度分析

### 4.1 常见复杂度

| 复杂度 | 名称 | 示例 |
|--------|------|------|
| O(1) | 常数 | 数组随机访问、HashMap get |
| O(log n) | 对数 | 二分查找、平衡树操作 |
| O(n) | 线性 | 线性扫描、链表遍历 |
| O(n log n) | 线性对数 | 快排、归并排序 |
| O(n²) | 平方 | 冒泡排序、嵌套循环 |
| O(2ⁿ) | 指数 | 递归求子集 |
| O(n!) | 阶乘 | 全排列 |

### 4.2 主定理（递归复杂度）

对于 `T(n) = aT(n/b) + f(n)`：
- 若 `f(n) = O(n^(log_b(a) - ε))`：`T(n) = O(n^log_b(a))`
- 若 `f(n) = O(n^log_b(a))`：`T(n) = O(n^log_b(a) * log n)`
- 若 `f(n) = Ω(n^(log_b(a) + ε))`：`T(n) = O(f(n))`

---

## 5. LeetCode 高频题型总结

### 5.1 Top K 问题

```java
// 方法1：最小堆（维护大小为K的堆）O(n log k)
int[] topKFrequent(int[] nums, int k) {
    Map<Integer, Integer> freq = new HashMap<>();
    for (int n : nums) freq.merge(n, 1, Integer::sum);
    
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[1] - b[1]);
    for (Map.Entry<Integer, Integer> e : freq.entrySet()) {
        pq.offer(new int[]{e.getKey(), e.getValue()});
        if (pq.size() > k) pq.poll();
    }
    
    return pq.stream().mapToInt(a -> a[0]).toArray();
}

// 方法2：快速选择 O(n) 平均
```

### 5.2 链表操作

```java
// 反转链表（迭代）
ListNode reverse(ListNode head) {
    ListNode prev = null, cur = head;
    while (cur != null) {
        ListNode next = cur.next;
        cur.next = prev;
        prev = cur;
        cur = next;
    }
    return prev;
}

// 找链表中点（快慢指针）
ListNode findMiddle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast.next != null && fast.next.next != null) {
        slow = slow.next;
        fast = fast.next.next;
    }
    return slow;
}

// 检测环（Floyd 算法）
boolean hasCycle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) return true;
    }
    return false;
}
```

### 5.3 树的遍历

```java
// 层序遍历（BFS）
List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> result = new ArrayList<>();
    if (root == null) return result;
    Queue<TreeNode> queue = new LinkedList<>();
    queue.offer(root);
    while (!queue.isEmpty()) {
        int size = queue.size();
        List<Integer> level = new ArrayList<>();
        for (int i = 0; i < size; i++) {
            TreeNode node = queue.poll();
            level.add(node.val);
            if (node.left != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }
        result.add(level);
    }
    return result;
}

// 迭代中序遍历
List<Integer> inorder(TreeNode root) {
    List<Integer> result = new ArrayList<>();
    Deque<TreeNode> stack = new ArrayDeque<>();
    TreeNode cur = root;
    while (cur != null || !stack.isEmpty()) {
        while (cur != null) { stack.push(cur); cur = cur.left; }
        cur = stack.pop();
        result.add(cur.val);
        cur = cur.right;
    }
    return result;
}
```

---

## 高频面试真题

### Q1：HashMap 的 put 流程？为什么容量是 2 的幂？

**答题框架**：
- 计算 hash（高低16位异或，减少碰撞）→ 确定桶位置（(n-1)&hash）→ 处理碰撞（链表/红黑树）→ 检查扩容
- 2的幂：(n-1)&hash 等价于 hash%n，位运算更快；扩容时可用位运算快速判断新位置（原位置或原位置+旧容量）

### Q2：HashMap 和 ConcurrentHashMap 的区别？

**答题框架**：
- HashMap 非线程安全，多线程下可能死循环（JDK7）或数据丢失
- ConcurrentHashMap JDK8：CAS+synchronized 锁桶头节点，粒度更细
- 读操作无锁（volatile 保证可见性），写操作锁单个桶
- size() 使用 LongAdder 思想分段计数

### Q3：快速排序的最坏情况是什么？如何优化？

**答题框架**：
- 最坏：数组已有序，每次选最后元素为 pivot，退化为 O(n²)
- 优化：随机选 pivot（`swap(arr, left + random.nextInt(right-left+1), right)`）；三数取中法；小数组用插入排序

### Q4：动态规划和回溯的区别？

**答题框架**：
- 动态规划：有重叠子问题和最优子结构，自底向上（或记忆化递归），求最优解
- 回溯：穷举所有可能，通过剪枝减少搜索空间，求所有解或判断是否存在解
- 区别：DP 不需要撤销选择（状态已记录），回溯需要撤销选择（恢复现场）

### Q5：如何找到数组中第 K 大的元素？

**答题框架**：
- 方法1：排序 O(n log n)，取第 n-k 个
- 方法2：最小堆维护 K 个元素 O(n log k)，适合数据流
- 方法3：快速选择 O(n) 平均，基于快排 partition，只递归一侧
- 生产选择：数据量小用排序；数据流用堆；追求极致性能用快速选择

---

## 学习建议

**备考重点**：HashMap 底层实现（必考）、排序算法（必考）、动态规划（高频）、二分查找变体（高频）

**LeetCode 推荐题单**：
- 数组/双指针：1、15、42、76、239
- 链表：21、23、141、142、206
- 树：94、102、105、124、236
- 动态规划：53、72、300、322、416
- 图：200、207、210、743

**推荐资源**：
- 《算法（第4版）》（Sedgewick）
- labuladong 算法小抄
- LeetCode 热题 HOT 100
