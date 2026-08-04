INSERT INTO problems (
    id, slug, title, description, difficulty, constraints_text,
    estimated_minutes, acceptance_rate, frequency, published
) VALUES
    (
        '10000000-0000-0000-0000-000000000008',
        'best-time-to-buy-and-sell-stock',
        'Best Time to Buy and Sell Stock',
        'Given an array prices where prices[i] is the stock price on day i, choose one day to buy and a later day to sell. Return the maximum profit, or 0 when no profit is possible.',
        'EASY',
        E'1 <= prices.length <= 100000\n0 <= prices[i] <= 10000',
        20, 54.30, 'HIGH', TRUE
    ),
    (
        '10000000-0000-0000-0000-000000000009',
        'minimum-size-subarray-sum',
        'Minimum Size Subarray Sum',
        'Given an array of positive integers nums and a positive target, return the minimum length of a contiguous subarray whose sum is at least target. Return 0 when no such subarray exists.',
        'MEDIUM',
        E'1 <= target <= 10^9\n1 <= nums.length <= 100000\n1 <= nums[i] <= 10000',
        25, 48.70, 'HIGH', TRUE
    ),
    (
        '10000000-0000-0000-0000-000000000010',
        'group-anagrams',
        'Group Anagrams',
        'Given an array of strings, group the anagrams together. The groups may be returned in any order.',
        'MEDIUM',
        E'1 <= strs.length <= 10000\n0 <= strs[i].length <= 100\nstrs[i] contains lowercase English letters.',
        25, 69.20, 'HIGH', TRUE
    ),
    (
        '10000000-0000-0000-0000-000000000011',
        'daily-temperatures',
        'Daily Temperatures',
        'Given daily temperatures, return an array where answer[i] is the number of days until a warmer temperature. Use 0 when no warmer future day exists.',
        'MEDIUM',
        E'1 <= temperatures.length <= 100000\n30 <= temperatures[i] <= 100',
        25, 66.10, 'HIGH', TRUE
    ),
    (
        '10000000-0000-0000-0000-000000000012',
        'search-in-rotated-sorted-array',
        'Search in Rotated Sorted Array',
        'A distinct ascending array was rotated at an unknown pivot. Return the index of target in O(log n) time, or -1 when target is absent.',
        'MEDIUM',
        E'1 <= nums.length <= 5000\n-10000 <= nums[i], target <= 10000\nAll values are unique.',
        30, 42.30, 'HIGH', TRUE
    ),
    (
        '10000000-0000-0000-0000-000000000013',
        'maximum-depth-of-binary-tree',
        'Maximum Depth of Binary Tree',
        'Given the root of a binary tree, return its maximum depth. The maximum depth is the number of nodes along the longest path from the root to a leaf.',
        'EASY',
        E'0 <= number of nodes <= 10000\n-100 <= Node.val <= 100',
        20, 75.40, 'HIGH', TRUE
    ),
    (
        '10000000-0000-0000-0000-000000000014',
        'course-schedule',
        'Course Schedule',
        'Given numCourses and prerequisite pairs [course, prerequisite], return whether all courses can be completed.',
        'MEDIUM',
        E'1 <= numCourses <= 2000\n0 <= prerequisites.length <= 5000\nEach prerequisite pair contains distinct course numbers.',
        30, 49.10, 'HIGH', TRUE
    ),
    (
        '10000000-0000-0000-0000-000000000015',
        'house-robber',
        'House Robber',
        'Given the amount of money in each house, return the maximum amount that can be robbed without robbing two adjacent houses.',
        'MEDIUM',
        E'1 <= nums.length <= 100\n0 <= nums[i] <= 400',
        25, 51.60, 'HIGH', TRUE
    ),
    (
        '10000000-0000-0000-0000-000000000016',
        'merge-intervals',
        'Merge Intervals',
        'Given an array of intervals, merge every overlapping interval and return the non-overlapping intervals that cover all input intervals.',
        'MEDIUM',
        E'1 <= intervals.length <= 10000\nintervals[i].length = 2\n0 <= start <= end <= 10000',
        25, 49.50, 'HIGH', TRUE
    )
ON CONFLICT (slug) DO NOTHING;

INSERT INTO problem_topics (problem_id, topic_id)
SELECT problem.id, topic.id
FROM (VALUES
    ('best-time-to-buy-and-sell-stock', 'arrays-strings'),
    ('minimum-size-subarray-sum', 'sliding-window'),
    ('minimum-size-subarray-sum', 'arrays-strings'),
    ('group-anagrams', 'hashing'),
    ('group-anagrams', 'arrays-strings'),
    ('daily-temperatures', 'stacks'),
    ('daily-temperatures', 'arrays-strings'),
    ('search-in-rotated-sorted-array', 'binary-search'),
    ('search-in-rotated-sorted-array', 'arrays-strings'),
    ('maximum-depth-of-binary-tree', 'trees'),
    ('course-schedule', 'graphs'),
    ('house-robber', 'dynamic-programming'),
    ('merge-intervals', 'intervals'),
    ('merge-intervals', 'arrays-strings')
) AS mapping(problem_slug, topic_slug)
JOIN problems problem ON problem.slug = mapping.problem_slug
JOIN topics topic ON topic.slug = mapping.topic_slug
ON CONFLICT DO NOTHING;

INSERT INTO problem_examples (problem_id, position, input_text, output_text, explanation)
SELECT problem.id, example.position, example.input_text, example.output_text, example.explanation
FROM (VALUES
    ('best-time-to-buy-and-sell-stock', 1::SMALLINT, 'prices = [7,1,5,3,6,4]', '5', 'Buy at 1 and sell at 6.'),
    ('best-time-to-buy-and-sell-stock', 2::SMALLINT, 'prices = [7,6,4,3,1]', '0', 'No profitable transaction exists.'),
    ('minimum-size-subarray-sum', 1::SMALLINT, 'target = 7, nums = [2,3,1,2,4,3]', '2', 'The subarray [4,3] has the minimum valid length.'),
    ('group-anagrams', 1::SMALLINT, 'strs = ["eat","tea","tan","ate","nat","bat"]', '[["bat"],["nat","tan"],["ate","eat","tea"]]', 'Strings with the same character counts belong together.'),
    ('daily-temperatures', 1::SMALLINT, 'temperatures = [73,74,75,71,69,72,76,73]', '[1,1,4,2,1,1,0,0]', 'Each value is the wait until a warmer day.'),
    ('search-in-rotated-sorted-array', 1::SMALLINT, 'nums = [4,5,6,7,0,1,2], target = 0', '4', 'Target 0 appears at index 4.'),
    ('search-in-rotated-sorted-array', 2::SMALLINT, 'nums = [4,5,6,7,0,1,2], target = 3', '-1', 'Target 3 is absent.'),
    ('maximum-depth-of-binary-tree', 1::SMALLINT, 'root = [3,9,20,null,null,15,7]', '3', 'The longest root-to-leaf path contains three nodes.'),
    ('course-schedule', 1::SMALLINT, 'numCourses = 2, prerequisites = [[1,0]]', 'true', 'Take course 0 before course 1.'),
    ('course-schedule', 2::SMALLINT, 'numCourses = 2, prerequisites = [[1,0],[0,1]]', 'false', 'The prerequisites contain a cycle.'),
    ('house-robber', 1::SMALLINT, 'nums = [1,2,3,1]', '4', 'Rob houses with values 1 and 3.'),
    ('house-robber', 2::SMALLINT, 'nums = [2,7,9,3,1]', '12', 'Rob houses with values 2, 9, and 1.'),
    ('merge-intervals', 1::SMALLINT, 'intervals = [[1,3],[2,6],[8,10],[15,18]]', '[[1,6],[8,10],[15,18]]', 'The first two intervals overlap and merge.')
) AS example(problem_slug, position, input_text, output_text, explanation)
JOIN problems problem ON problem.slug = example.problem_slug
ON CONFLICT (problem_id, position) DO NOTHING;

INSERT INTO starter_code (problem_id, language, source_code)
SELECT problem.id, starter.language, starter.source_code
FROM (VALUES
    ('best-time-to-buy-and-sell-stock', 'JAVA', E'class Solution {\n    public int maxProfit(int[] prices) {\n        // Implement your solution\n        return 0;\n    }\n}'),
    ('best-time-to-buy-and-sell-stock', 'PYTHON', E'class Solution:\n    def maxProfit(self, prices: list[int]) -> int:\n        pass'),
    ('minimum-size-subarray-sum', 'JAVA', E'class Solution {\n    public int minSubArrayLen(int target, int[] nums) {\n        // Implement your solution\n        return 0;\n    }\n}'),
    ('minimum-size-subarray-sum', 'PYTHON', E'class Solution:\n    def minSubArrayLen(self, target: int, nums: list[int]) -> int:\n        pass'),
    ('group-anagrams', 'JAVA', E'import java.util.*;\n\nclass Solution {\n    public List<List<String>> groupAnagrams(String[] strs) {\n        // Implement your solution\n        return new ArrayList<>();\n    }\n}'),
    ('group-anagrams', 'PYTHON', E'class Solution:\n    def groupAnagrams(self, strs: list[str]) -> list[list[str]]:\n        pass'),
    ('daily-temperatures', 'JAVA', E'class Solution {\n    public int[] dailyTemperatures(int[] temperatures) {\n        // Implement your solution\n        return new int[temperatures.length];\n    }\n}'),
    ('daily-temperatures', 'PYTHON', E'class Solution:\n    def dailyTemperatures(self, temperatures: list[int]) -> list[int]:\n        pass'),
    ('search-in-rotated-sorted-array', 'JAVA', E'class Solution {\n    public int search(int[] nums, int target) {\n        // Implement your solution\n        return -1;\n    }\n}'),
    ('search-in-rotated-sorted-array', 'PYTHON', E'class Solution:\n    def search(self, nums: list[int], target: int) -> int:\n        pass'),
    ('maximum-depth-of-binary-tree', 'JAVA', E'// TreeNode has int val, TreeNode left, and TreeNode right.\nclass Solution {\n    public int maxDepth(TreeNode root) {\n        // Implement your solution\n        return 0;\n    }\n}'),
    ('maximum-depth-of-binary-tree', 'PYTHON', E'# TreeNode has val, left, and right fields.\nclass Solution:\n    def maxDepth(self, root) -> int:\n        pass'),
    ('course-schedule', 'JAVA', E'class Solution {\n    public boolean canFinish(int numCourses, int[][] prerequisites) {\n        // Implement your solution\n        return false;\n    }\n}'),
    ('course-schedule', 'PYTHON', E'class Solution:\n    def canFinish(self, numCourses: int, prerequisites: list[list[int]]) -> bool:\n        pass'),
    ('house-robber', 'JAVA', E'class Solution {\n    public int rob(int[] nums) {\n        // Implement your solution\n        return 0;\n    }\n}'),
    ('house-robber', 'PYTHON', E'class Solution:\n    def rob(self, nums: list[int]) -> int:\n        pass'),
    ('merge-intervals', 'JAVA', E'class Solution {\n    public int[][] merge(int[][] intervals) {\n        // Implement your solution\n        return new int[0][0];\n    }\n}'),
    ('merge-intervals', 'PYTHON', E'class Solution:\n    def merge(self, intervals: list[list[int]]) -> list[list[int]]:\n        pass')
) AS starter(problem_slug, language, source_code)
JOIN problems problem ON problem.slug = starter.problem_slug
ON CONFLICT (problem_id, language) DO NOTHING;
