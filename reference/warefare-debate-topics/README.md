# Wayfare debate topics

- `topics.json`: 120 topics, 20 in each of 6 categories (Church Life, Faith & Tech, Friendships & Relationships, Money & Hustle, Campus Life, Bible & Faith). Difficulty: light, medium, deep.
- `seed_debate_topics.sql`: inserts or updates all 120 in Supabase (idempotent), then unpublishes the old placeholder topics.
- Every topic is a statement, so AGREE and DISAGREE always make sense.
- Add new topics by adding a row with a new `dt-###` id and re-running the SQL.
