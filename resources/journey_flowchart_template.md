# Journey Flowchart Template (Mermaid)

```mermaid
flowchart TD
  A[Trigger: Form Submitted] --> B[Email 1: Welcome]
  B --> C{Clicked?}
  C -- Yes --> D[Email 2: Invite]
  C -- No  --> E[Email 2: Tips]
  D --> F[End]
  E --> F[End]
```
