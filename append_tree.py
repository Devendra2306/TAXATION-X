import os

def print_tree(startpath, exclude_dirs=set()):
    tree_str = "```text\nOFS TAXATION/\n"
    for root, dirs, files in os.walk(startpath):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        level = root.replace(startpath, '').count(os.sep)
        
        # Don't show root itself in the loop, just its children
        if root != startpath:
            indent = ' ' * 4 * (level - 1)
            tree_str += f"{indent}├── {os.path.basename(root)}/\n"
            
        subindent = ' ' * 4 * (level)
        for f in files:
            if not f.endswith(('.pyc', '.pyo')) and f not in ['.DS_Store']:
                tree_str += f"{subindent}├── {f}\n"
    tree_str += "```\n"
    return tree_str

if __name__ == "__main__":
    excludes = {'.git', 'node_modules', '.next', '__pycache__', 'venv', 'alembic', '.pytest_cache'}
    tree_output = print_tree('.', excludes)
    
    with open('NEXTAX_TECH_STACK.md', 'a', encoding='utf-8') as f:
        f.write("\n## 5. Directory Structure\n\n")
        f.write(tree_output)
        
    print("Tree appended.")
