import os

def patch_login():
    path = r"frontend\app\(auth)\login\page.tsx"
    with open(path, 'r', encoding='utf-8') as f:
        code = f.read()
    
    if "import { useState, useEffect }" not in code:
        code = code.replace("import { useState }", "import { useState, useEffect }")
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(code)

def patch_signup():
    path = r"frontend\app\(auth)\signup\page.tsx"
    with open(path, 'r', encoding='utf-8') as f:
        code = f.read()
    
    if "import React, { useState, useEffect }" not in code:
        code = code.replace("import React, { useState }", "import React, { useState, useEffect }")
        
    # Fix order
    effect_block = """  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (loading) {
      timeoutId = setTimeout(() => setIsSlowLoading(true), 3500);
    } else {
      setIsSlowLoading(false);
    }
    return () => clearTimeout(timeoutId);
  }, [loading]);"""
    
    code = code.replace(effect_block, "")
    code = code.replace("const [isSlowLoading, setIsSlowLoading] = useState(false);", "const [isSlowLoading, setIsSlowLoading] = useState(false);\n" + effect_block)
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(code)

patch_login()
patch_signup()
print("Patched.")
