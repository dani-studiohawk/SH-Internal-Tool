Backend routes

Each assistant is a separate API endpoint:

/api/find-trends → calls Exploding Trends API, returns list.

/api/ideation → given a trend (and brand), returns 10 angles.

/api/headlines → given an angle, returns 5–10 headlines.

/api/press-release → given a headline/angle, returns a draft.

Because each returns JSON, they can be chained. For example:

User selects a trend → frontend calls /api/ideation.

Picks an angle → frontend calls /api/headlines.

Chooses a headline → frontend calls /api/press-release.

But the user can also jump in anywhere — e.g. open the Headline tool directly.

Frontend (React/Next.js)

Sidebar → direct access to each assistant.
Workflow mode → wizard-like navigation.

Example routes:

/dashboard

/trend-assistant (Screen 1 & 2)

/trend/:id/ideation (Screen 3 left column + ideation results)

/trend/:id/ideation/:angleId/headlines

/trend/:id/ideation/:angleId/headlines/:headlineId/press

Each step pulls from the backend and passes data forward.

State management

You’ll want to keep track of the user’s “active workflow”:

Selected brand/industry

Selected trend

Selected angle

Selected headline

Current press release draft

Options:

Store in frontend state (React context or Redux).

Or, store in backend (sessions in DB), so users can return later.

Independent mode:
User can click Headline Assistant in the sidebar, paste their own angle, and get headlines.

Workflow mode:
User starts with Find Trends, then “Next Step” buttons take them through each stage automatically, passing the selected item to the next tool.

Basically you build four reusable React components (TrendPicker, IdeationPanel, HeadlinePanel, PressDraft), and add a “wizard wrapper” that renders them in sequence.

You’ll want to save:

User profiles

Active workflows (trend, angle, headline, draft)

Saved drafts/alerts

So if they leave halfway, they can come back and continue.