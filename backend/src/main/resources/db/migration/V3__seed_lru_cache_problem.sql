INSERT INTO problems (
    id, slug, title, description, difficulty, constraints_text,
    estimated_minutes, acceptance_rate, frequency, published
) VALUES (
    '10000000-0000-0000-0000-000000000007',
    'lru-cache',
    'Design an LRU Cache',
    'Design an LRU cache that supports get and put operations. get returns the stored value or -1 when the key is absent. put inserts or updates a value and evicts the least recently used key when capacity is exceeded. Both operations must run in O(1) average time.',
    'MEDIUM',
    '1 <= capacity <= 3000\n0 <= key <= 10000\n0 <= value <= 100000\nAt most 200000 calls will be made to get and put.',
    35,
    44.60,
    'HIGH',
    TRUE
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO problem_topics (problem_id, topic_id)
SELECT problem.id, topic.id
FROM (VALUES
    ('lru-cache', 'hashing'),
    ('lru-cache', 'system-design')
) AS mapping(problem_slug, topic_slug)
JOIN problems problem ON problem.slug = mapping.problem_slug
JOIN topics topic ON topic.slug = mapping.topic_slug
ON CONFLICT DO NOTHING;

INSERT INTO problem_examples (problem_id, position, input_text, output_text, explanation)
SELECT problem.id, example.position, example.input_text, example.output_text, example.explanation
FROM (VALUES
    (
        'lru-cache',
        1::SMALLINT,
        'operations = ["LRUCache","put","put","get","put","get","get"], arguments = [[2],[1,1],[2,2],[1],[3,3],[2],[3]]',
        '[null,null,null,1,null,-1,3]',
        'Adding key 3 evicts key 2 because it is the least recently used entry.'
    )
) AS example(problem_slug, position, input_text, output_text, explanation)
JOIN problems problem ON problem.slug = example.problem_slug
ON CONFLICT (problem_id, position) DO NOTHING;

INSERT INTO starter_code (problem_id, language, source_code)
SELECT problem.id, starter.language, starter.source_code
FROM (VALUES
    ('lru-cache', 'JAVA', E'class LRUCache {\n    public LRUCache(int capacity) {\n        // Initialize your data structures\n    }\n\n    public int get(int key) {\n        return -1;\n    }\n\n    public void put(int key, int value) {\n        // Insert or update the entry\n    }\n}'),
    ('lru-cache', 'PYTHON', E'class LRUCache:\n    def __init__(self, capacity: int):\n        pass\n\n    def get(self, key: int) -> int:\n        return -1\n\n    def put(self, key: int, value: int) -> None:\n        pass')
) AS starter(problem_slug, language, source_code)
JOIN problems problem ON problem.slug = starter.problem_slug
ON CONFLICT (problem_id, language) DO NOTHING;
