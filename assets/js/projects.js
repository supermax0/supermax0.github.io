/**
 * Projects Display Module
 * عرض المشاريع في الصفحات
 */

/**
 * Open preview modal with iframe
 * فتح نافذة المعاينة مع iframe
 */
async function openPreview(url, project) {
    var modal = document.getElementById('previewModal');
    var iframe = document.getElementById('previewFrame');
    
    if (modal && iframe) {
        try {
            if (project && project.projectType === 'file') {
                var mergedHTML = await mergeProjectFiles(project);
                if (mergedHTML) {
                    // Create blob with merged HTML content and proper encoding
                    const blob = new Blob([mergedHTML], { type: 'text/html; charset=utf-8' });
                    const blobUrl = URL.createObjectURL(blob);
                    iframe.src = blobUrl;
                    
                    // Clean up blob URL when modal closes
                    modal.addEventListener('close', function cleanup() {
                        URL.revokeObjectURL(blobUrl);
                        modal.removeEventListener('close', cleanup);
                    }, { once: true });
                } else {
                    iframe.src = url;
                }
            } else {
                iframe.src = url;
            }
            
            modal.classList.add('active');
            
            // Close modal when clicking outside
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    closePreview();
                }
            });
        } catch (error) {
            console.error('Error opening preview:', error);
            // Show error page in iframe
            iframe.src = 'data:text/html;charset=utf-8,' + encodeURIComponent(`
                <!DOCTYPE html>
                <html lang="ar" dir="rtl">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>خطأ في التحميل</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            min-height: 100vh;
                            margin: 0;
                            background: #1e293b;
                            color: #fff;
                            text-align: center;
                            padding: 2rem;
                        }
                        .error-container {
                            max-width: 500px;
                        }
                        h1 { color: #ef4444; }
                        p { color: #94a3b8; line-height: 1.6; }
                        code {
                            background: rgba(239, 68, 68, 0.2);
                            padding: 0.2rem 0.5rem;
                            border-radius: 4px;
                            font-size: 0.9em;
                        }
                    </style>
                </head>
                <body>
                    <div class="error-container">
                        <h1>⚠️ خطأ في تحميل المعاينة</h1>
                        <p>حدث خطأ أثناء تحميل ملفات المشروع من Firebase Storage.</p>
                        <p>السبب المحتمل: <code>مشكلة CORS</code></p>
                        <p style="margin-top: 1rem; font-size: 0.9em;">
                            راجع ملف <code>FIREBASE_CORS_SETUP.md</code> لإصلاح المشكلة.
                        </p>
                    </div>
                </body>
                </html>
            `);
            modal.classList.add('active');
        }
    }
}

/**
 * Convert base64 to Blob
 * تحويل base64 إلى Blob
 */
function base64ToBlob(base64) {
    const parts = base64.split(',');
    const contentType = parts[0].match(/:(.*?);/)[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    
    for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }
    
    return new Blob([uInt8Array], { type: contentType });
}

/**
 * Extract text content from base64 data URL
 * استخراج المحتوى النصي من base64
 */
function base64ToText(base64) {
    try {
        const parts = base64.split(',');
        const base64Data = parts[1];
        
        // Decode base64 to binary string
        const binaryString = window.atob(base64Data);
        
        // Convert binary string to UTF-8
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        // Use TextDecoder to properly handle UTF-8 encoding
        const decoder = new TextDecoder('utf-8');
        return decoder.decode(bytes);
    } catch (error) {
        console.error('Error decoding base64:', error);
        // Fallback to simple atob
        const parts = base64.split(',');
        return window.atob(parts[1]);
    }
}

/**
 * Get text from file (content base64 or url)
 * يحصل على النص من الملف (base64 أو رابط Firebase Storage)
 */
async function getFileText(file) {
    // If file has base64 content, decode it
    if (file.content) {
        return Promise.resolve(base64ToText(file.content));
    }
    
    // If file has URL, try to fetch it
    if (file.url) {
        try {
            // Try fetching with CORS mode
            const response = await fetch(file.url, {
                mode: 'cors',
                credentials: 'omit'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.text();
        } catch (error) {
            console.error('Failed to fetch file from URL:', file.url, error);
            
            // If it's a CORS error, show helpful message
            if (error.message.includes('CORS') || error.name === 'TypeError') {
                console.warn('CORS error detected. Please configure CORS in Firebase Storage console.');
                console.warn('To fix: Go to Firebase Console > Storage > Rules and add CORS configuration');
            }
            
            // Return error comment instead of crashing
            return Promise.resolve('<!-- Error loading file: ' + (file.name || 'unknown') + ' - ' + error.message + ' -->');
        }
    }
    
    return Promise.resolve('');
}

/**
 * Merge all project files into a complete HTML document
 * دمج جميع ملفات المشروع في مستند HTML كامل (يدعم base64 و Firebase Storage URLs)
 */
async function mergeProjectFiles(project) {
    if (!project.files || Object.keys(project.files).length === 0) {
        if (project.fileContent) return base64ToText(project.fileContent);
        return null;
    }
    
    var files = project.files;
    var htmlContent = '';
    var cssContent = '';
    var jsContent = '';
    var pyContent = '';
    
    var htmlFile = null;
    for (var k in files) {
        var f = files[k];
        var n = (f.name || k).toLowerCase();
        if ((n.endsWith('.html') || n.endsWith('.htm')) && !htmlFile) htmlFile = f;
    }
    if (!htmlFile) return null;
    
    htmlContent = await getFileText(htmlFile);
    
    for (var key in files) {
        var file = files[key];
        var name = (file.name || key).toLowerCase();
        if (name.endsWith('.css')) {
            cssContent += '/* ' + file.name + ' */\n' + (await getFileText(file)) + '\n\n';
        }
    }
    for (var key2 in files) {
        var file2 = files[key2];
        var name2 = (file2.name || key2).toLowerCase();
        if (name2.endsWith('.js')) {
            jsContent += '/* ' + file2.name + ' */\n' + (await getFileText(file2)) + '\n\n';
        }
    }
    for (var key3 in files) {
        var file3 = files[key3];
        var name3 = (file3.name || key3).toLowerCase();
        if (name3.endsWith('.py')) {
            pyContent += '# ' + file3.name + '\n' + (await getFileText(file3)) + '\n\n';
        }
    }
    
    // Parse HTML and inject CSS and JS
    let mergedHTML = htmlContent;
    
    // Ensure HTML has proper charset declaration
    if (!mergedHTML.includes('charset') && !mergedHTML.includes('charset')) {
        // Check if HTML has <head> tag
        if (mergedHTML.includes('<head>')) {
            // Add charset meta tag if not exists
            if (!mergedHTML.includes('<meta charset')) {
                mergedHTML = mergedHTML.replace('<head>', '<head>\n<meta charset="UTF-8">');
            }
            // Inject CSS before </head>
            if (cssContent) {
                mergedHTML = mergedHTML.replace('</head>', `<style>\n${cssContent}</style>\n</head>`);
            }
        } else {
            // Create head tag if it doesn't exist
            if (mergedHTML.includes('<html>')) {
                mergedHTML = mergedHTML.replace('<html>', `<html>\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n${cssContent ? `<style>\n${cssContent}</style>\n` : ''}</head>`);
            } else {
                // No HTML structure, wrap it
                mergedHTML = `<!DOCTYPE html>\n<html lang="ar" dir="rtl">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n${cssContent ? `<style>\n${cssContent}</style>\n` : ''}</head>\n<body>\n${mergedHTML}\n</body>\n</html>`;
            }
        }
    } else {
        // HTML already has charset, just inject CSS
        if (mergedHTML.includes('<head>') && cssContent) {
            mergedHTML = mergedHTML.replace('</head>', `<style>\n${cssContent}</style>\n</head>`);
        }
    }
    
    // Inject JS before </body> or at the end
    if (jsContent) {
        if (mergedHTML.includes('</body>')) {
            mergedHTML = mergedHTML.replace('</body>', `<script>\n${jsContent}</script>\n</body>`);
        } else if (mergedHTML.includes('</html>')) {
            mergedHTML = mergedHTML.replace('</html>', `<script>\n${jsContent}</script>\n</html>`);
        } else {
            mergedHTML += `\n<script>\n${jsContent}</script>`;
        }
    }
    
    // Add Python files as comments or in a special section (for reference)
    if (pyContent && mergedHTML.includes('</body>')) {
        const pyComment = `\n<!-- Python Files (for reference):\n${pyContent.replace(/-->/g, '--&gt;')}\n-->`;
        mergedHTML = mergedHTML.replace('</body>', `${pyComment}\n</body>`);
    }
    
    return mergedHTML;
}

/**
 * Close preview modal
 * إغلاق نافذة المعاينة
 */
function closePreview() {
    const modal = document.getElementById('previewModal');
    const iframe = document.getElementById('previewFrame');
    
    if (modal && iframe) {
        // Trigger close event to clean up blob URLs
        modal.dispatchEvent(new Event('close'));
        modal.classList.remove('active');
        iframe.src = '';
    }
}

/**
 * Open description modal
 * فتح نافذة الوصف
 */
function openDescriptionModal(projectName, description) {
    const modal = document.getElementById('descriptionModal');
    const modalTitle = document.getElementById('descriptionTitle');
    const modalContent = document.getElementById('descriptionContent');
    
    if (modal && modalTitle && modalContent) {
        modalTitle.textContent = projectName;
        modalContent.innerHTML = renderMarkdown(description);
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Close description modal
 * إغلاق نافذة الوصف
 */
function closeDescriptionModal() {
    const modal = document.getElementById('descriptionModal');
    
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

/**
 * Render Markdown to HTML
 * تحويل Markdown إلى HTML
 */
function renderMarkdown(text) {
    if (!text) return '';
    
    // Escape HTML first
    let html = escapeHtml(text);
    
    // Headers (##, ###, etc.)
    html = html.replace(/^### (.*$)/gim, '<h3 class="markdown-h3">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="markdown-h2">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="markdown-h1">$1</h1>');
    
    // Bold (**text**)
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong class="markdown-bold">$1</strong>');
    
    // Italic (*text*)
    html = html.replace(/\*(.*?)\*/gim, '<em class="markdown-italic">$1</em>');
    
    // Unordered lists (- item or * item)
    html = html.replace(/^[\-\*] (.+)$/gim, '<li class="markdown-li">$1</li>');
    
    // Wrap consecutive list items in <ul>
    html = html.replace(/(<li class="markdown-li">.*?<\/li>\n?)+/gim, function(match) {
        return '<ul class="markdown-ul">' + match + '</ul>';
    });
    
    // Ordered lists (1. item)
    html = html.replace(/^\d+\. (.+)$/gim, '<li class="markdown-li-ordered">$1</li>');
    
    // Wrap consecutive ordered list items in <ol>
    html = html.replace(/(<li class="markdown-li-ordered">.*?<\/li>\n?)+/gim, function(match) {
        return '<ol class="markdown-ol">' + match + '</ol>';
    });
    
    // Code blocks (```code```)
    html = html.replace(/```([\s\S]*?)```/gim, '<pre class="markdown-code-block"><code>$1</code></pre>');
    
    // Inline code (`code`)
    html = html.replace(/`([^`]+)`/gim, '<code class="markdown-inline-code">$1</code>');
    
    // Links [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="markdown-link" target="_blank" rel="noopener">$1</a>');
    
    // Line breaks (double newline = paragraph)
    html = html.split('\n\n').map(para => {
        para = para.trim();
        if (!para) return '';
        // Don't wrap if it's already a block element
        if (/^<(h[1-6]|ul|ol|pre|p)/.test(para)) {
            return para;
        }
        return '<p class="markdown-p">' + para + '</p>';
    }).join('\n');
    
    // Single line breaks
    html = html.replace(/\n/gim, '<br class="markdown-br">');
    
    return html;
}

/**
 * Handle project preview/open
 * التعامل مع معاينة/فتح المشروع
 */
async function handleProjectAction(project) {
    if (project.displayType === 'preview') {
        openPreview(project.url, project);
    } else {
        // For file projects, create blob URL
        if (project.projectType === 'file') {
            try {
                // Merge all files (HTML, CSS, JS) into complete HTML
                const mergedHTML = await mergeProjectFiles(project);
                
                if (mergedHTML) {
                    const blob = new Blob([mergedHTML], { type: 'text/html; charset=utf-8' });
                    const blobUrl = URL.createObjectURL(blob);
                    const newWindow = window.open(blobUrl, '_blank');
                    // Clean up blob URL after a delay
                    setTimeout(() => {
                        if (newWindow) {
                            newWindow.addEventListener('beforeunload', () => {
                                URL.revokeObjectURL(blobUrl);
                            });
                        } else {
                            URL.revokeObjectURL(blobUrl);
                        }
                    }, 100);
                } else {
                    window.open(project.url, '_blank');
                }
            } catch (error) {
                console.error('Error opening project:', error);
                alert('حدث خطأ أثناء فتح المشروع. تحقق من الكونسول للتفاصيل.');
            }
        } else {
            window.open(project.url, '_blank');
        }
    }
}

/**
 * Create project card HTML
 * إنشاء HTML لبطاقة المشروع
 */
async function createProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'project-card';
    
    const projectId = project.id;
    const projectUrl = escapeHtml(project.url);
    const displayType = project.displayType;
    
    // Create preview URL
    let previewUrl = project.url;
    let blobUrl = null;
    let hasError = false;
    
    if (project.projectType === 'file') {
        try {
            // Merge all files (HTML, CSS, JS) into complete HTML
            const mergedHTML = await mergeProjectFiles(project);
            
            if (mergedHTML) {
                // Check if HTML contains error comments
                if (mergedHTML.includes('<!-- Error loading file:')) {
                    hasError = true;
                    console.warn('Some files failed to load for project:', project.name);
                }
                
                const blob = new Blob([mergedHTML], { type: 'text/html; charset=utf-8' });
                blobUrl = URL.createObjectURL(blob);
                previewUrl = blobUrl;
                // Store blob URL for cleanup
                card.dataset.blobUrl = blobUrl;
            }
        } catch (error) {
            console.error('Error merging project files:', error);
            hasError = true;
            // Show error message in preview
            previewUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(`
                <!DOCTYPE html>
                <html lang="ar" dir="rtl">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>خطأ في التحميل</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            min-height: 100vh;
                            margin: 0;
                            background: #1e293b;
                            color: #fff;
                            text-align: center;
                            padding: 2rem;
                        }
                        .error-container {
                            max-width: 500px;
                        }
                        h1 { color: #ef4444; }
                        p { color: #94a3b8; line-height: 1.6; }
                        code {
                            background: rgba(239, 68, 68, 0.2);
                            padding: 0.2rem 0.5rem;
                            border-radius: 4px;
                            font-size: 0.9em;
                        }
                    </style>
                </head>
                <body>
                    <div class="error-container">
                        <h1>⚠️ خطأ في تحميل الملفات</h1>
                        <p>حدث خطأ أثناء تحميل ملفات المشروع من Firebase Storage.</p>
                        <p>السبب المحتمل: <code>مشكلة CORS</code></p>
                        <p style="margin-top: 1rem; font-size: 0.9em;">
                            راجع ملف <code>FIREBASE_CORS_SETUP.md</code> لإصلاح المشكلة.
                        </p>
                    </div>
                </body>
                </html>
            `);
        }
    }
    
    card.innerHTML = `
        <div class="project-card-header">
            <h3>${escapeHtml(project.name)}</h3>
        </div>
        <div class="project-card-preview">
            <iframe class="project-preview-iframe" src="${previewUrl}" frameborder="0" loading="lazy"></iframe>
            <div class="project-preview-overlay">
                <button class="btn btn-primary project-preview-btn" data-project-id="${projectId}">
                    معاينة كاملة
                </button>
            </div>
        </div>
        <div class="project-card-body">
            <div class="project-card-actions">
                <button class="btn btn-secondary project-description-btn" data-project-id="${projectId}" data-description="${escapeHtml(project.description)}">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style="margin-left: 0.5rem;">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
                    </svg>
                    عرض الوصف
                </button>
                <button class="btn btn-primary project-action-btn" data-project-id="${projectId}" data-display-type="${displayType}" data-url="${projectUrl}">
                    ${displayType === 'preview' ? 'معاينة كاملة' : 'فتح المشروع'}
                </button>
                ${displayType === 'preview' ? `
                    <button class="btn btn-outline project-open-btn" data-project-id="${projectId}">
                        فتح بصفحة جديدة
                    </button>
                ` : ''}
            </div>
        </div>
    `;
    
    // Add event listeners
    const descriptionBtn = card.querySelector('.project-description-btn');
    if (descriptionBtn) {
        descriptionBtn.addEventListener('click', function() {
            const description = this.getAttribute('data-description');
            openDescriptionModal(project.name, description);
        });
    }
    
    const actionBtn = card.querySelector('.project-action-btn');
    if (actionBtn) {
        actionBtn.addEventListener('click', function() {
            handleProjectAction(project);
        });
    }
    
    const openBtn = card.querySelector('.project-open-btn');
    if (openBtn) {
        openBtn.addEventListener('click', async function() {
            // For file projects, create blob URL
            if (project.projectType === 'file') {
                // Merge all files (HTML, CSS, JS) into complete HTML
                const mergedHTML = await mergeProjectFiles(project);
                
                if (mergedHTML) {
                    const blob = new Blob([mergedHTML], { type: 'text/html; charset=utf-8' });
                    const blobUrl = URL.createObjectURL(blob);
                    const newWindow = window.open(blobUrl, '_blank');
                    // Clean up blob URL after a delay
                    setTimeout(() => {
                        if (newWindow) {
                            newWindow.addEventListener('beforeunload', () => {
                                URL.revokeObjectURL(blobUrl);
                            });
                        } else {
                            URL.revokeObjectURL(blobUrl);
                        }
                    }, 100);
                } else {
                    window.open(project.url, '_blank');
                }
            } else {
                window.open(project.url, '_blank');
            }
        });
    }
    
    // Add overlay button event listener
    const overlayBtn = card.querySelector('.project-preview-overlay .project-preview-btn');
    if (overlayBtn) {
        overlayBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            handleProjectAction(project);
        });
    }
    
    // Make overlay clickable to open preview
    const previewOverlay = card.querySelector('.project-preview-overlay');
    if (previewOverlay) {
        previewOverlay.addEventListener('click', function(e) {
            if (e.target === previewOverlay || e.target.classList.contains('project-preview-overlay')) {
                handleProjectAction(project);
            }
        });
    }
    
    // Clean up blob URL when card is removed
    if (card.dataset.blobUrl) {
        // Store cleanup function
        card.addEventListener('remove', function() {
            URL.revokeObjectURL(card.dataset.blobUrl);
        });
    }
    
    return card;
}

/**
 * Escape HTML to prevent XSS
 * حماية من XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Load and display all projects
 * تحميل وعرض جميع المشاريع
 */
async function loadAllProjects() {
    const container = document.getElementById('projectsGrid');
    if (!container) return;
    
    const projects = getActiveProjects();
    
    // Clear container
    container.innerHTML = '';
    
    if (projects.length === 0) {
        container.innerHTML = '<p class="no-projects">لا توجد مشاريع حالياً. أضف مشاريع من <a href="dashboard.html">لوحة التحكم</a>.</p>';
        return;
    }
    
    // Create cards for each project (await all async operations)
    const cardPromises = projects.map(project => createProjectCard(project));
    const cards = await Promise.all(cardPromises);
    cards.forEach(card => {
        container.appendChild(card);
    });
}

/**
 * Load latest projects (for homepage)
 * تحميل آخر المشاريع (للصفحة الرئيسية)
 */
async function loadLatestProjects() {
    const container = document.getElementById('latestProjects');
    if (!container) return;
    
    const projects = getActiveProjects().slice(0, 6); // Show only 6 latest
    
    // Clear container
    container.innerHTML = '';
    
    if (projects.length === 0) {
        container.innerHTML = '<p class="no-projects">لا توجد مشاريع حالياً. أضف مشاريع من لوحة التحكم.</p>';
        return;
    }
    
    // Create cards for each project (await all async operations)
    const cardPromises = projects.map(project => createProjectCard(project));
    const cards = await Promise.all(cardPromises);
    cards.forEach(card => {
        container.appendChild(card);
    });
}

// Close modal handlers + Firestore updates
document.addEventListener('DOMContentLoaded', function() {
    const modalClose = document.getElementById('modalClose');
    const previewModalClose = document.getElementById('previewModalClose');
    
    if (modalClose) {
        modalClose.addEventListener('click', closePreview);
    }
    
    if (previewModalClose) {
        previewModalClose.addEventListener('click', closePreview);
    }
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closePreview();
        }
    });
    
    // Reload projects when Firestore updates
    window.addEventListener('projectsUpdated', async function() {
        await loadAllProjects();
        await loadLatestProjects();
    });
});

// Make functions available globally
window.openPreview = openPreview;
window.closePreview = closePreview;
window.openDescriptionModal = openDescriptionModal;
window.closeDescriptionModal = closeDescriptionModal;
window.handleProjectAction = handleProjectAction;
window.loadAllProjects = loadAllProjects;
window.loadLatestProjects = loadLatestProjects;
