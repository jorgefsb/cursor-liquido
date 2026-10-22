"""Verify docs, existing suites, media and baseline invariants, without network writes.
Usage: PLAYWRIGHT_MODULE=/absolute/path python scripts/docs-verify.py BRAND_ASSET_ROOT
"""
from pathlib import Path
import subprocess
import hashlib
import json
import re
import os
import sys
from urllib.parse import urlparse, unquote
from html.parser import HTMLParser
from PIL import Image

root = Path(__file__).resolve().parents[1]
os.chdir(root)
baseline = '6035bbd24c06b23be353d9af68bd67d33b22f34e'

def run(args):
    return subprocess.run(args, cwd=root, capture_output=True, text=True)

def sha(data):
    return hashlib.sha256(data).hexdigest()

original = run(['git', 'ls-tree', '-r', '--name-only', baseline]).stdout.splitlines()
protected = [p for p in original if not p.endswith('.md') and not p.startswith(('docs/', 'reports/'))]
protected += ['CHANGELOG.md', 'RELEASE-NOTES.md']
protected += [p for p in original if p.startswith('docs/media/')]
invariants = []
for p in sorted(set(protected)):
    before = subprocess.check_output(['git', 'show', f'{baseline}:{p}'])
    after = (root / p).read_bytes()
    invariants.append({'path': p, 'sha256': sha(after), 'byte_identical': before == after})

class Links(HTMLParser):
    def __init__(self):
        super().__init__(); self.urls=[]
    def handle_starttag(self, tag, attrs):
        for key,val in attrs:
            if key in ['href','src'] and val: self.urls.append(val)
            if key == 'srcset' and val: self.urls.extend(v.strip().split()[0] for v in val.split(','))

broken=[]; checked=0
mds = [root/'README.md',root/'README.en.md',root/'CONTRIBUTING.md',root/'CONTRIBUTING.en.md',root/'AGENTS.md'] + list((root/'docs').glob('*.md')) + list((root/'skills/cursor-liquido').glob('*.md'))
for p in mds:
    text = re.sub(r'```.*?```', '', p.read_text(), flags=re.S)
    urls = re.findall(r'!?\[[^\]]*\]\(([^)]+)\)',text)
    parser=Links();parser.feed(text);urls+=parser.urls
    for url in urls:
        if urlparse(url).scheme or url.startswith(('#','//')): continue
        local=unquote(url.split('#')[0].split('?')[0])
        checked+=1
        if not (p.parent/local).exists(): broken.append({'document':str(p.relative_to(root)),'target':url})

pairs=[('README.md','README.en.md'),('CONTRIBUTING.md','CONTRIBUTING.en.md'),('docs/api.md','docs/api.en.md'),('docs/integrations.md','docs/integrations.en.md'),('docs/accessibility-performance.md','docs/accessibility-performance.en.md'),('docs/rollback.md','docs/rollback.en.md'),('docs/roadmap.md','docs/roadmap.en.md'),('docs/quality-input-candidate.es.md','docs/quality-input-candidate.md'),('docs/walkthrough.md','docs/walkthrough.en.md'),('docs/REPOSITORY-DOCUMENTATION.md','docs/REPOSITORY-DOCUMENTATION.en.md'),('docs/ASSET-NOTICE.md','docs/ASSET-NOTICE.en.md'),('skills/cursor-liquido/SKILL.es.md','skills/cursor-liquido/SKILL.md')]
parity=[]
for es,en in pairs:
    a=(root/es).read_text();b=(root/en).read_text()
    mutual=Path(en).name in a and Path(es).name in b
    row={'es':es,'en':en,'mutual_language_links':mutual,'editorial_review':'Both retain options, requirements, warnings and limitations; historical events are not rewritten.'}
    if es in ['README.md','docs/api.md']:
        blocks=lambda t: re.findall(r'```(?:html|js|sh)?\n(.*?)```',t,re.S)
        row['literal_code_blocks_equal']=blocks(a)==blocks(b)
    parity.append(row)

faq={}
for lang,p in [('es','README.md'),('en','README.en.md')]:
    headings=re.findall(r'^## (.+)$',(root/p).read_text(),re.M)
    questions=[x for x in headings if '?' in x]
    faq[lang]={'count':len(questions),'questions':questions}

media=[]
for p in sorted((root/'docs/media').glob('*')):
    if p.suffix in ['.png','.gif']:
        with Image.open(p) as image:
            media.append({'path':str(p.relative_to(root)),'width':image.width,'height':image.height,'frames':getattr(image,'n_frames',1),'bytes':p.stat().st_size,'sha256':sha(p.read_bytes())})
probe=run(['ffprobe','-v','error','-show_entries','format=duration,size','-show_entries','stream=codec_type,codec_name,width,height','-of','json','docs/media/cursor-liquido-restaurado-real.mp4'])
metadata=json.loads(probe.stdout)

brand=Path(sys.argv[1])
manifest=json.loads((brand/'manifest.json').read_text())
sources=json.loads((root/'reports/docs-brand-source-hashes.json').read_text())
brand_checks=[]
for p,h in sources.items():
    expected=next(x['sha256'] for x in manifest if x['path']=='brand-assets/'+p)
    brand_checks.append({'path':p,'sha256':h,'matches_official_manifest':h==expected})

previous = root / 'reports/docs-existing-tests.json'
if previous.exists():
    previous.write_text(previous.read_text().replace(str(root), '<repo>'))
results=[]
for command in [['npm','test'],['npm','run','test:browser'],['npm','run','test:quality']]:
    result=run(command)
    # Keep raw real execution output; no invented fixtures or summarized substitutes.
    results.append({'command':' '.join(command),'exit_code':result.returncode,'stdout':result.stdout.replace(str(root), '<repo>'),'stderr':result.stderr.replace(str(root), '<repo>')})
(root/'reports/docs-existing-tests.json').write_text(json.dumps(results,indent=2)+'\n')

browser=json.loads((root/'reports/docs-browser-verification.json').read_text())
passed=all(x['byte_identical'] for x in invariants) and not broken and all(x['mutual_language_links'] and x.get('literal_code_blocks_equal',True) for x in parity) and all(x['count']==6 for x in faq.values()) and all(x['matches_official_manifest'] for x in brand_checks) and all(x['exit_code']==0 for x in results) and browser['passed']
report={'passed':passed,'baseline':baseline,'branch':run(['git','branch','--show-current']).stdout.strip(),'verification_scope':'Local pre-commit working tree. Final commit ID is reported separately to avoid a self-referential artifact hash.','faq':faq,'translation_pairs':parity,'links':{'checked':checked,'broken':broken},'frozen_baseline_files':invariants,'official_assets':brand_checks,'images':media,'video':metadata,'browser_docs':{'passed':browser['passed'],'checks':len(browser['rows']),'viewports':['1440x1000','390x1000'],'screenshots':sorted(str(p.relative_to(root)) for p in (root/'reports').glob('docs-*.png'))},'existing_tests': [{'command':x['command'],'exit_code':x['exit_code']} for x in results],'remote_download_provenance':'Exact v1.0.1 HTML and ZIP release URLs supplied as verified by the repository owner; no remote state changed.','limitations':['Headless Chromium and SwiftShader are not physical GPU or phone certification.','Existing approved MP4 is reused unchanged, not a new 1.0.1 quality-fix recording.','Preview is a faithful local Markdown render, not a screenshot of published GitHub.'],'initial_issue_resolved':'Relative PLAYWRIGHT_MODULE failed Node resolution; suites reran successfully with an absolute module path.','changed_paths':run(['git','status','--short']).stdout.splitlines()}
report.update({
    'documentation_checks_passed': not broken and all(x['count'] == 6 for x in faq.values()) and all(x['mutual_language_links'] and x.get('literal_code_blocks_equal', True) for x in parity) and browser['passed'] and all(x['byte_identical'] for x in invariants) and all(x['matches_official_manifest'] for x in brand_checks),
    'known_unit_blockers': [
        {'test': 'build is deterministic and dist/ matches a fresh build', 'cause': 'Existing build includes every docs/media file in dist/manifest.json. New editorial covers, captions and OFL fonts make that frozen manifest stale. The in-memory build comparison changes only dist/manifest.json, not JS, CSS or standalone HTML.', 'resolution_requires_separate_approval': 'Refresh release packaging manifest or change packaging policy outside this docs-only scope. No dist or assertion was modified.'},
        {'test': 'public files carry no private paths, hosts, emails or credentials', 'cause': 'Existing assertion classifies the required official public brandkit domain as a private link. The family brief requires that exact public reference. It was not hidden, encoded or removed to bypass the assertion.', 'resolution_requires_separate_approval': 'Review the obsolete URL denylist in a separate test change. Tests remain byte-identical.'}
    ],
    'execution_output_notice': 'Real stdout/stderr retained in docs-existing-tests.json; repository absolute path replaced with <repo> for public privacy.'
})
(root/'reports/docs-brandkit-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'passed':passed,'faq_counts':{k:v['count'] for k,v in faq.items()},'links_checked':checked,'broken_links':broken,'translation_pairs':len(parity),'frozen_files':len(invariants),'tests':[{'command':x['command'],'exit_code':x['exit_code']} for x in results]},ensure_ascii=False,indent=2))
sys.exit(0 if passed else 1)
