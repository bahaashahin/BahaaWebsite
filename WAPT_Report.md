    # **Penetration Testing Summary Report**
    **Target:** Students Portal (students-portal-94c83)  
    **Date:** March 15, 2026  
    **Status:** Partial Remediation / Critical Risks Outstanding  

    ---

    ## **1. Executive Summary (For CEO)**
    The security assessment of the Students Portal application revealed a **Critical** security posture. While surface-level routing issues have been addressed, the core architectural design relies heavily on "Client-Side Trust." 

    **Critical Risks:** 
    *   **Administrative Access Bypass:** Any user with basic technical knowledge can easily elevate their privileges to "Admin" without a password.
    *   **Data Integrity Failure:** Users can modify their own scores, points, and quiz results directly in the database.
    *   **Financial/Reputational Risk:** The exposure of Firebase API keys and the lack of server-side validation could lead to unauthorized database usage, data theft, and loss of institutional integrity.

    **Recommendation:** Immediate implementation of Firebase Security Rules and server-side validation via Cloud Functions is required to prevent total system compromise.

    ---

    ## **2. Technical Overview (For CTO)**
    The application utilizes a **React + Firebase** architecture. The primary vulnerability is **Insecure Direct Object Reference (IDOR)** combined with **Bypassing Client-Side Controls**. The application trusts the client (the browser) to manage user roles and data logic.

    **Key Architectural Flaws:**
    1.  **Credential Hardcoding:** Total exposure of Firebase backend configuration.
    2.  **State-Based Authorization:** Authorization logic is implemented in React Hooks (`useState`) which are manipulatable at runtime.
    3.  **Direct Database Access:** The frontend possesses write-access to sensitive fields (points, roles) which should be restricted to backend processes.

    ---

    ## **3. Detailed Findings & Risk Assessment (For Pentesting/Dev Team)**

    ### **Vulnerability Matrix**

    | Ref ID | Finding | OWASP (2021/25) | Severity | Status |
    | :--- | :--- | :--- | :--- | :--- |
    | **V-01** | Broken Access Control (RBAC Bypass) | A01:2021 | **CRITICAL** | **Open** |
    | **V-02** | Insecure Points/Data Modification | A01:2021 / A04:2021 | **HIGH** | **Open** |
    | **V-03** | Sensitive Information Disclosure (Hardcoded Keys) | A05:2021 | **MEDIUM** | **Open** |
    | **V-04** | Security Misconfiguration (Missing Secure Flags) | A05:2021 | **LOW** | **Open** |
    | **V-05** | Improper Session Handling (Routing Leaks) | A07:2021 | **FIXED** | Verified |

    ---

    ### **V-01: Broken Access Control (RBAC Bypass via Client-Side State)**
    *   **CWE:** CWE-285: Improper Authorization
    *   **CVSS v3.1 Score:** 9.8 (**Critical**) - `AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H`
    *   **Description:** The application determines if a user is an admin by checking a React state variable `t` or the response from `As(o)`. Since this check happens in the browser, an attacker can override the logic or intercept the network response to spoof an admin role.
    *   **Evidence:** 
        ```javascript
        // Vulnerable logic in index.js
        t === "admin" ? k.jsx(GM, { role: t }) : k.jsx("p", { children: " Access Denied " })
        ```
        **PoC:** Intercepting the Firebase `Listen/channel` response via Burp Suite and changing `{ "role": "student" }` to `{ "role": "admin" }` grants full access to the `/admin-points` panel.
    *   **Remediation:** Implement **Firestore Security Rules** that verify the user's role on the server.
        ```javascript
        // Example Rule
        match /students/{userId} {
        allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
        }
        ```

    ---

    ### **V-02: Data Integrity Breach (Direct Points/Quiz Modification)**
    *   **CWE:** CWE-639: IDOR of Sensitive HDS
    *   **CVSS v3.1 Score:** 8.1 (**High**) - `AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:H/A:L`
    *   **Description:** The application performs sensitive updates (adding points, submitting quiz results) directly from the client. An attacker can use the browser console to call `updateDoc` (aliased as `ym`) and set their `bonus` points to any value.
    *   **Evidence:** 
        ```javascript
        // Vulnerable update call in index.js
        await ym(v, { points: I }); // I is calculated on client
        ```
    *   **Remediation:** Sensitive data calculations must happen on the server (Firebase Cloud Functions). The student should never have `write` access to the `points` field.

    ---

    ### **V-03: Hardcoded API Credentials**
    *   **CWE:** CWE-798: Use of Hardcoded Credentials
    *   **CVSS v3.1 Score:** 5.3 (**Medium**) - `AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:N`
    *   **Description:** The Firebase project configuration is exposed in the `index.js` file. While Firebase API keys are intended to be public, their exposure combined with weak Security Rules allows an attacker to interact with the database using external scripts.
    *   **Evidence:**
        ```javascript
        const mD = { 
            apiKey: "AIzaSyBSpUATJndLCNBhWyCiGYyqB5vaaSC029o", 
            projectId: "students-portal-94c83", 
            ... 
        };
        ```
    *   **Remediation:** Secure the backend using **Firebase App Check** and strictly enforce **Security Rules** to ensure that knowing the API key does not grant unauthorized access.

    ---

    ### **V-04: Missing Secure Flags (HttpOnly/Secure/SameSite)**
    *   **CWE:** CWE-615: Inclusion of Sensitive Info in Source Code
    *   **CVSS v3.1 Score:** 3.3 (**Low**) - `AV:N/AC:L/PR:N/UI:R/S:U/C:L/I:N/A:N`
    *   **Description:** As reported, session tokens or authentication data stored in the browser do not utilize strict `Secure` and `HttpOnly` flags, making them susceptible to XSS-based theft.
    *   **Remediation:** Configure Firebase Auth to use `SESSION` persistence where possible or ensure any custom cookies are set with `Secure; HttpOnly; SameSite=Strict`.

    ---

    ## **4. Final Conclusion**
    While the team has successfully patched the "Routing Leaks," the application remains highly vulnerable due to **logic being performed on the client-side**. A determined attacker can effectively take over the role of an Administrator and manipulate all student records.

    **Immediate Priority:** 
    1. Lock down Firestore with granular **write rules**.
    2. Rotate the **Firebase API Key** once security rules are in place.
    3. Move Point and Quiz logic to **Backend Functions**.

    ---
    **Reported by:** 
    Senior Penetration Tester  
    [Antigravity Security Research]
