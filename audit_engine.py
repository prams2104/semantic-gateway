import requests
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
import html2text
import io
import pymupdf  # Install via: pip install pymupdf

import requests
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
import html2text
import pymupdf

def extract_content(url):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(url, wait_until="networkidle")
        
        # 1. Clean the 'Human' noise
        h = html2text.HTML2Text()
        h.ignore_images = True
        h.ignore_links = False
        raw_markdown = h.handle(page.content())
        
        # 2. Identify 'High-Value' Assets (PDFs, Tables, or hidden Schema)
        # This part now looks for ANY .pdf, not just menus
        assets = [a.get_attribute("href") for a in page.query_selector_all("a[href$='.pdf']")]
        
        extra_data = ""
        for asset in set(assets):
            full_url = asset if asset.startswith("http") else url.rstrip('/') + asset
            # Use pymupdf to 'unfold' any PDF document found
            try:
                res = requests.get(full_url, timeout=10)
                with pymupdf.open(stream=res.content, filetype="pdf") as doc:
                    text = "".join([page.get_text() for page in doc])
                    extra_data += f"\n--- UNFOLDED DOCUMENT ({full_url}) ---\n{text}\n"
            except:
                continue
                
        browser.close()
        return raw_markdown + extra_data

# Example: Run on a local law firm or medical clinic
# final_md = extract_content("https://example-local-business.com")

if __name__ == "__main__":
    # Test on Treehouse to see the PDF menu "unfolded"
    target_url = "https://treehousesm.com/"
    final_md = extract_content(target_url)

    # Save the result to your new 'reports' folder
    with open("reports/treehouse_audit.md", "w") as f:
        f.write(f"# AI Audit for {target_url}\n")
        f.write(final_md)
    print("\n Audit saved to reports/treehouse_audit.md")