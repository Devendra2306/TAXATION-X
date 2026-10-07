import os

def update_auth_page(path):
    if not os.path.exists(path):
        return
    with open(path, 'r', encoding='utf-8') as f:
        code = f.read()

    # If it already has slow loading logic, skip
    if "isSlowLoading" in code:
        return

    # Add the state
    code = code.replace("const [loading, setLoading] = useState(false);", 
                        "const [loading, setLoading] = useState(false);\n  const [isSlowLoading, setIsSlowLoading] = useState(false);")
    
    # Add the effect
    effect = """  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (loading) {
      timeoutId = setTimeout(() => setIsSlowLoading(true), 3500);
    } else {
      setIsSlowLoading(false);
    }
    return () => clearTimeout(timeoutId);
  }, [loading]);
"""
    code = code.replace("const router = useRouter();", "const router = useRouter();\n" + effect)
    
    # Make sure useEffect is imported
    if "useEffect" not in code:
        code = code.replace("import React, { useState }", "import React, { useState, useEffect }")
        code = code.replace("import { useState }", "import { useState, useEffect }")

    # Add the warning text under the button
    warning_ui = """              {isSlowLoading && (
                <div className="text-center mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-xs text-amber-700 font-semibold flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>
                    Waking up secure server...
                  </p>
                  <p className="text-[10px] text-amber-600 mt-1">Render's free tier sleeps after inactivity. This may take up to 45 seconds.</p>
                </div>
              )}"""
    
    code = code.replace("</button>\n\n                <div className=\"text-center pt-1\">", "</button>\n" + warning_ui + "\n                <div className=\"text-center pt-1\">")
    
    # Also for the Google button loading state
    code = code.replace("disabled={loading} className=\"btn-primary w-full py-3.5 mt-2\">", "disabled={loading} className=\"btn-primary w-full py-3.5 mt-2 relative overflow-hidden\">")

    with open(path, 'w', encoding='utf-8') as f:
        f.write(code)

update_auth_page(r"frontend\app\(auth)\login\page.tsx")
update_auth_page(r"frontend\app\(auth)\signup\page.tsx")

print("Added slow loading UI to Auth pages.")
