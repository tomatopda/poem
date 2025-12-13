import JSZip from 'jszip';
import { Poem, LayoutMode, ThemeStyle } from '../types';

/**
 * EPUB 3.0 Generator for Ink & Verse
 * Simplified Layout Strategy:
 * - Removes Flexbox and VH units (major causes of EPUB fragmentation).
 * - Uses standard flow layout.
 * - Removes aggressive page-break constraints to allow natural flow.
 */
export const generateEpub = async (poems: Poem[]): Promise<void> => {
  const zip = new JSZip();
  const date = new Date().toISOString().split('T')[0];
  const uuid = crypto.randomUUID();

  // 1. Mimetype
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

  // 2. META-INF/container.xml
  zip.folder("META-INF")?.file("container.xml", `<?xml version="1.0" ?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`);

  // 3. OEBPS Folder
  const oebps = zip.folder("OEBPS");
  if (!oebps) throw new Error("Failed to create OEBPS folder");

  const imagesFolder = oebps.folder("images");

  // --- Styles CSS ---
  const cssContent = `
    @namespace epub "http://www.idpf.org/2007/ops";
    
    body {
      margin: 0;
      padding: 10px;
      font-family: "Noto Serif SC", "Songti SC", "SimSun", serif;
      background-color: #fdfbf7;
      color: #3a3a31;
      line-height: 1.6;
    }

    /* Cover Page */
    .cover-container {
      text-align: center;
      margin-top: 25%;
      margin-bottom: 10%;
    }

    .cover-box {
      border: 4px double #333;
      padding: 2em;
      margin: 0 auto;
      display: inline-block;
      min-width: 220px;
    }

    .cover-title {
      font-size: 2.5em; 
      margin: 0;
      font-weight: bold;
      line-height: 1.4;
    }
    
    .title-part {
      display: block;
      white-space: nowrap;
    }

    .cover-subtitle {
      font-size: 1.2em;
      color: #555;
      margin-top: 1em;
    }

    /* Poem Page */
    .poem-container {
      text-align: center;
      margin: 0 auto;
    }

    .image-wrapper {
      text-align: center;
      margin-bottom: 1em;
    }

    img.poem-image {
      max-width: 100%;
      height: auto;
      max-height: 400px;
      margin: 0 auto;
    }

    /* Clean Title - No Borders */
    .poem-title {
      font-size: 1.6em; 
      font-weight: bold;
      margin: 0.5em 0 0.5em 0; 
      color: #1d1d18;
      display: block; 
      border: none;
      line-height: 1.3;
    }

    .poem-author {
      font-size: 0.9em;
      color: #7d7d6a;
      margin-bottom: 1.2em;
      font-style: italic;
    }

    .poem-content {
      font-size: 1.1em;
      text-align: left; 
      white-space: pre-wrap; 
      color: #3a3a31;
      margin: 0 auto;
      display: inline-block;
      text-align: left;
      max-width: 100%;
      padding-bottom: 0;
    }
    
    a { color: inherit; text-decoration: none; }
    
    /* Navigation */
    nav#toc ol { list-style-type: none; padding: 0; text-align: center; }
    nav#toc li { margin-bottom: 1em; border-bottom: 1px dashed #ccc; padding-bottom: 0.5em; }
  `;
  oebps.file("styles.css", cssContent);

  // --- Process Items ---
  const manifestItems: string[] = [];
  const spineItems: string[] = [];
  
  manifestItems.push(`<item id="css" href="styles.css" media-type="text/css"/>`);
  manifestItems.push(`<item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>`);
  spineItems.push(`<itemref idref="cover"/>`);
  manifestItems.push(`<item id="toc" href="toc.xhtml" media-type="application/xhtml+xml" properties="nav"/>`);
  spineItems.push(`<itemref idref="toc"/>`);

  for (let i = 0; i < poems.length; i++) {
    const poem = poems[i];
    const poemId = `poem_${i}`;
    let imgHtml = '';

    if (poem.imageUrl && poem.imageUrl.startsWith('data:image')) {
      const ext = poem.imageUrl.substring(poem.imageUrl.indexOf('/') + 1, poem.imageUrl.indexOf(';'));
      const imgName = `image_${i}.${ext}`;
      const base64 = poem.imageUrl.split(',')[1];
      
      imagesFolder?.file(imgName, base64, { base64: true });
      manifestItems.push(`<item id="img_${i}" href="images/${imgName}" media-type="image/${ext === 'jpg' ? 'jpeg' : ext}"/>`);
      
      imgHtml = `<div class="image-wrapper"><img src="images/${imgName}" class="poem-image" alt="illustration"/></div>`;
    }

    // Standard HTML Structure
    const poemHtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="zh-CN" lang="zh-CN">
<head>
  <title>${poem.title}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <div class="poem-container">
    ${imgHtml}
    <div class="poem-title">${poem.title || '无题'}</div>
    <div class="poem-author">${poem.author ? '— ' + poem.author : ''}</div>
    <div class="poem-content">${poem.content ? poem.content.trim() : ''}</div>
  </div>
</body>
</html>`;

    oebps.file(`${poemId}.xhtml`, poemHtml);
    manifestItems.push(`<item id="${poemId}" href="${poemId}.xhtml" media-type="application/xhtml+xml"/>`);
    spineItems.push(`<itemref idref="${poemId}"/>`);
  }

  // 4. Content.opf
  const opfContent = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>墨韵诗集 (Ink & Verse)</dc:title>
    <dc:creator>Ink & Verse</dc:creator>
    <dc:language>zh-CN</dc:language>
    <dc:identifier id="BookId">urn:uuid:${uuid}</dc:identifier>
    <meta property="dcterms:modified">${new Date().toISOString().split('.')[0]}Z</meta>
  </metadata>
  <manifest>
    ${manifestItems.join('\n    ')}
  </manifest>
  <spine page-progression-direction="ltr">
    ${spineItems.join('\n    ')}
  </spine>
</package>`;

  oebps.file("content.opf", opfContent);

  // 5. TOC
  oebps.file("toc.xhtml", `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="zh-CN">
<head>
  <title>目录</title>
  <link rel="stylesheet" href="styles.css"/>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1 style="text-align:center; margin-bottom: 1em;">目录</h1>
    <ol>${poems.map((p, i) => `<li><a href="poem_${i}.xhtml">${p.title || '无题'}</a></li>`).join('')}</ol>
  </nav>
</body>
</html>`);

  // 6. Cover - Block level divs for title
  oebps.file("cover.xhtml", `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="zh-CN">
<head>
  <title>封面</title>
  <link rel="stylesheet" href="styles.css"/>
</head>
<body>
  <div class="cover-container">
    <div class="cover-box">
      <div class="cover-title">
        <div class="title-part">墨韵</div>
        <div class="title-part">诗集</div>
      </div>
      <p class="cover-subtitle">Ink & Verse</p>
    </div>
    <p style="margin-top: 3em; font-size: 0.9em; color: #666;">${date}</p>
  </div>
</body>
</html>`);

  // 7. Output
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `墨韵诗集_${date}.epub`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
