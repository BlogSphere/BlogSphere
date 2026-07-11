# System Interaction & User Flow Map 📊

This document maps out the system architecture, user personas, backend routes, database stores, and AI integration boundaries of the **Smart Community Blog Platform**.

---

## 1. Interaction Diagram

Below is the architectural flow showing how frontend components, user roles, backend routers, MongoDB schemas, and Google Gemini AI services interact.

```mermaid
graph TD
    %% User Roles
    subgraph Users ["User Personas"]
        Guest["👤 Anonymous Guest"]
        Creator["✍️ Creator / Writer"]
        Admin["🛡️ Administrator"]
    end

    %% Frontend App
    subgraph Frontend ["React 19 Frontend App"]
        Galaxy["🌌 Knowledge Galaxy (Physics Explorer)"]
        Dashboard["📊 Creator Dashboard"]
        Editor["📝 Block Editor & DocTutor AI"]
        AdminPanel["⚙️ Admin Control Panel"]
    end

    %% Backend Server
    subgraph Backend ["Node & Express.js Backend API"]
        Router["🛣️ Router & Middleware (JWT Auth)"]
        Controllers["🎮 Business Logic Controllers"]
        Socket["⚡ Socket.io Real-time Server"]
    end

    %% Database Models
    subgraph Database ["Mongoose / MongoDB Data Store"]
        M_User[("User Schema")]
        M_Blog[("Blog Schema")]
        M_Brief[("DailyBrief Schema")]
        M_Notif[("Notification Schema")]
    end

    %% AI Services
    subgraph AIServices ["Google Gemini AI Integration"]
        GeminiBrief["📝 Daily Executive Brief & Themes"]
        DocTutor["📖 Real-time Draft Review Tutor"]
        BlockEnhancer["💡 Text Enhancer & Translators"]
    end

    %% Interaction Paths
    Guest -->|Explores star nodes| Galaxy
    Guest -->|Reads & Translates| Galaxy
    
    Creator -->|Writes drafts / updates| Editor
    Creator -->|Views telemetry earnings| Dashboard
    Creator -->|Likes & reacts to posts| Galaxy
    Editor <-->|Tutoring queries| DocTutor
    Editor <-->|Auto-generate text| BlockEnhancer
    
    Admin -->|Manages reported content| AdminPanel
    Admin -->|Triggers Auto-posts| AdminPanel
    Admin -->|Generates Daily AI Summaries| AdminPanel
    AdminPanel <-->|Fetches analytics| GeminiBrief
    GeminiBrief -->|Persists Daily summaries| M_Brief
    
    %% API Requests
    Frontend <-->|REST API Requests| Router
    Router <--> Controllers
    Controllers <--> Database
    Controllers -->|Dispatches Alerts| Socket
    Socket -.->|Real-time notifications| Frontend
```

---

## 2. User Roles & Capabilities

| Role | Core Capabilities | System Interactions |
| :--- | :--- | :--- |
| **👤 Anonymous Guest** | • Read published blogs.<br>• Perform basic translations.<br>• Interact with the Knowledge Galaxy. | • Query `GET /api/blogs`<br>• Read Canvas nodes. |
| **✍️ Registered Creator** | • Create & edit blog drafts.<br>• Use DocTutor review feedback.<br>• React, comment, and like articles.<br>• Track earnings metrics (views, reactions). | • Write to `Blog` Schema.<br>• Listen to real-time notifications via WebSockets.<br>• Retrieve analytics telemetry. |
| **🛡️ Platform Admin** | • Promote/demote user profiles.<br>• Dismiss or delete flagged posts.<br>• View creator earnings ledger.<br>• Compile and generate Daily AI Briefs. | • Query `DailyBrief` Mongoose model.<br>• Route requests to Gemini AI API.<br>• Moderation controls. |

---

## 3. Core Subsystems

1. **Vite / React 19 Frontend**: Renders user interfaces, visual Knowledge Galaxy canvas (panning/zooming star layouts), editor blocks, and theme configs.
2. **Express & Node API Server**: Shields backend operations with JWT authentication middleware and serves telemetry analytics.
3. **MongoDB Data Layer**: Models platform states:
   * [User.js](file:///c:/Users/Dell/Desktop/Blog/src/server/models/User.js) (Auth details & reputation ledger)
   * [Blog.js](file:///c:/Users/Dell/Desktop/Blog/src/server/models/Blog.js) (Articles, translation arrays, block JSONs)
   * [DailyBrief.js](file:///c:/Users/Dell/Desktop/Blog/src/server/models/DailyBrief.js) (Daily executive reports)
4. **Google Gemini 2.5 Flash API**: powers text enhancing, draft auditing (DocTutor), automated publishing, and admin summaries.
