INSERT INTO topics (slug, name, description) VALUES
    ('stacks', 'Stacks', 'LIFO structures, monotonic stacks, and expression parsing'),
    ('binary-search', 'Binary Search', 'Search on sorted data and monotonic answer spaces'),
    ('intervals', 'Intervals', 'Sorting, merging, and scheduling intervals')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO problems (
    id, slug, title, description, difficulty, constraints_text,
    estimated_minutes, acceptance_rate, frequency, published
) VALUES
    (
        '10000000-0000-0000-0000-000000000001',
        'two-sum',
        'Two Sum',
        'Given an array of integers nums and an integer target, return the indices of the two numbers whose sum equals target. Each input has exactly one solution, and the same element cannot be used twice.',
        'EASY',
        '2 <= nums.length <= 10000\n-10^9 <= nums[i], target <= 10^9\nExactly one valid answer exists.',
        15,
        55.40,
        'HIGH',
        TRUE
    ),
    (
        '10000000-0000-0000-0000-000000000002',
        'valid-parentheses',
        'Valid Parentheses',
        'Given a string containing only parentheses, brackets, and braces, determine whether every opening symbol is closed by the same type in the correct order.',
        'EASY',
        '1 <= s.length <= 10000\ns contains only ()[]{}.',
        15,
        41.80,
        'HIGH',
        TRUE
    ),
    (
        '10000000-0000-0000-0000-000000000003',
        'binary-search',
        'Binary Search',
        'Given a sorted array of distinct integers and a target, return its index. Return -1 when the target is not present. The solution must run in O(log n) time.',
        'EASY',
        '1 <= nums.length <= 10000\n-10000 < nums[i], target < 10000\nnums is sorted in ascending order.',
        15,
        58.20,
        'MEDIUM',
        TRUE
    ),
    (
        '10000000-0000-0000-0000-000000000004',
        'longest-substring-without-repeating-characters',
        'Longest Substring Without Repeating Characters',
        'Given a string s, find the length of the longest substring without repeating characters.',
        'MEDIUM',
        '0 <= s.length <= 50000\ns consists of letters, digits, symbols, and spaces.',
        25,
        51.30,
        'HIGH',
        TRUE
    ),
    (
        '10000000-0000-0000-0000-000000000005',
        'number-of-islands',
        'Number of Islands',
        'Given an m by n grid of 1 characters representing land and 0 characters representing water, return the number of islands. Adjacent land connects horizontally or vertically.',
        'MEDIUM',
        '1 <= m, n <= 300\ngrid[i][j] is 0 or 1.',
        30,
        60.90,
        'HIGH',
        TRUE
    ),
    (
        '10000000-0000-0000-0000-000000000006',
        'coin-change',
        'Coin Change',
        'Given integer coin denominations and an amount, return the fewest coins needed to make that amount. Return -1 when the amount cannot be made.',
        'MEDIUM',
        '1 <= coins.length <= 12\n1 <= coins[i] <= 2^31 - 1\n0 <= amount <= 10000.',
        30,
        45.70,
        'HIGH',
        TRUE
    )
ON CONFLICT (slug) DO NOTHING;

INSERT INTO problem_topics (problem_id, topic_id)
SELECT problem.id, topic.id
FROM (VALUES
    ('two-sum', 'arrays-strings'),
    ('two-sum', 'hashing'),
    ('valid-parentheses', 'stacks'),
    ('valid-parentheses', 'arrays-strings'),
    ('binary-search', 'binary-search'),
    ('binary-search', 'arrays-strings'),
    ('longest-substring-without-repeating-characters', 'sliding-window'),
    ('longest-substring-without-repeating-characters', 'hashing'),
    ('longest-substring-without-repeating-characters', 'arrays-strings'),
    ('number-of-islands', 'graphs'),
    ('number-of-islands', 'arrays-strings'),
    ('coin-change', 'dynamic-programming')
) AS mapping(problem_slug, topic_slug)
JOIN problems problem ON problem.slug = mapping.problem_slug
JOIN topics topic ON topic.slug = mapping.topic_slug
ON CONFLICT DO NOTHING;

INSERT INTO problem_examples (problem_id, position, input_text, output_text, explanation)
SELECT problem.id, example.position, example.input_text, example.output_text, example.explanation
FROM (VALUES
    ('two-sum', 1::SMALLINT, 'nums = [2,7,11,15], target = 9', '[0,1]', 'nums[0] + nums[1] equals 9.'),
    ('two-sum', 2::SMALLINT, 'nums = [3,2,4], target = 6', '[1,2]', NULL),
    ('valid-parentheses', 1::SMALLINT, 's = "()[]{}"', 'true', 'Each opening symbol closes in the correct order.'),
    ('valid-parentheses', 2::SMALLINT, 's = "([)]"', 'false', 'The bracket closes before the parenthesis.'),
    ('binary-search', 1::SMALLINT, 'nums = [-1,0,3,5,9,12], target = 9', '4', 'The target is at zero-based index 4.'),
    ('longest-substring-without-repeating-characters', 1::SMALLINT, 's = "abcabcbb"', '3', 'The answer is abc, with length 3.'),
    ('longest-substring-without-repeating-characters', 2::SMALLINT, 's = "bbbbb"', '1', 'The longest valid substring is b.'),
    ('number-of-islands', 1::SMALLINT, 'grid = [["1","1","0"],["1","0","0"],["0","0","1"]]', '2', 'The grid contains two disconnected land components.'),
    ('coin-change', 1::SMALLINT, 'coins = [1,2,5], amount = 11', '3', 'The optimal combination is 5 + 5 + 1.'),
    ('coin-change', 2::SMALLINT, 'coins = [2], amount = 3', '-1', 'The amount cannot be formed.')
) AS example(problem_slug, position, input_text, output_text, explanation)
JOIN problems problem ON problem.slug = example.problem_slug
ON CONFLICT (problem_id, position) DO NOTHING;

INSERT INTO starter_code (problem_id, language, source_code)
SELECT problem.id, starter.language, starter.source_code
FROM (VALUES
    ('two-sum', 'JAVA', E'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Implement your solution\n        return new int[0];\n    }\n}'),
    ('two-sum', 'PYTHON', E'class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        pass'),
    ('valid-parentheses', 'JAVA', E'class Solution {\n    public boolean isValid(String s) {\n        // Implement your solution\n        return false;\n    }\n}'),
    ('valid-parentheses', 'PYTHON', E'class Solution:\n    def isValid(self, s: str) -> bool:\n        pass'),
    ('binary-search', 'JAVA', E'class Solution {\n    public int search(int[] nums, int target) {\n        // Implement your solution\n        return -1;\n    }\n}'),
    ('binary-search', 'PYTHON', E'class Solution:\n    def search(self, nums: list[int], target: int) -> int:\n        pass'),
    ('longest-substring-without-repeating-characters', 'JAVA', E'class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        // Implement your solution\n        return 0;\n    }\n}'),
    ('longest-substring-without-repeating-characters', 'PYTHON', E'class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        pass'),
    ('number-of-islands', 'JAVA', E'class Solution {\n    public int numIslands(char[][] grid) {\n        // Implement your solution\n        return 0;\n    }\n}'),
    ('number-of-islands', 'PYTHON', E'class Solution:\n    def numIslands(self, grid: list[list[str]]) -> int:\n        pass'),
    ('coin-change', 'JAVA', E'class Solution {\n    public int coinChange(int[] coins, int amount) {\n        // Implement your solution\n        return -1;\n    }\n}'),
    ('coin-change', 'PYTHON', E'class Solution:\n    def coinChange(self, coins: list[int], amount: int) -> int:\n        pass')
) AS starter(problem_slug, language, source_code)
JOIN problems problem ON problem.slug = starter.problem_slug
ON CONFLICT (problem_id, language) DO NOTHING;
