let allData = [];

// 初始化
async function init() {
    try {
        // 1. 加载配置
        const configRes = await fetch('./config.json');
        if (configRes.ok) {
            const config = await configRes.json();
            document.title = config.siteTitle;
            const titleEl = document.getElementById('siteTitle');
            const descEl = document.getElementById('siteDesc');
            if (titleEl) titleEl.innerText = config.siteTitle;
            if (descEl) descEl.innerText = config.siteDesc;
        }

        // 2. 解析 CSV
        // 注意：使用 Papa.parse 时确保路径正确
        Papa.parse('./data/selection.csv', {
            download: true,
            header: true,
            skipEmptyLines: true,
            encoding: "UTF-8",
            complete: function(results) {
                console.log("CSV数据解析成功:", results.data);
                allData = results.data;
                
                if (allData.length > 0) {
                    renderCards(allData);
                    const countEl = document.getElementById('count');
                    if (countEl) countEl.innerText = allData.length;
                } else {
                    document.getElementById('productGrid').innerHTML = "CSV文件内没有数据。";
                }
            },
            error: function(err) {
                document.getElementById('productGrid').innerHTML = "CSV解析错误: " + err;
            }
        });
    } catch (err) {
        document.getElementById('productGrid').innerHTML = "初始化失败，请检查文件路径或配置。";
        console.error(err);
    }
}

// 渲染函数
function renderCards(data) {
    const grid = document.getElementById('productGrid');
    if (!grid) return;

    grid.innerHTML = data.map(item => {
        // 处理图片URL：优先使用[参考图片链接]，没有则给占位图
        const imgUrl = item['参考图片链接'] || 'https://via.placeholder.com/400?text=No+Image';
        
        return `
        <div class="card ${item.Priority || 'P2'}">
            <div class="priority-badge">${item.Priority || 'P2'}</div>
            <div class="img-container" style="height:200px; overflow:hidden; background:#eee;">
                <img class="card-img" src="${imgUrl}" 
                     style="width:100%; height:100%; object-fit:contain;"
                     onerror="this.src='https://via.placeholder.com/400?text=Image+Error'">
            </div>
            <div class="card-content">
                <div class="category" style="font-size:12px; color:#888;">${item.L1 || ''} > ${item.L2 || ''}</div>
                <div class="title" style="font-weight:bold; margin:10px 0;">${item['商品描述 (名称)'] || '未命名商品'}</div>
                <div class="price-row" style="color:#ee4d2d; font-weight:bold;">
                    <span>R$</span>
                    <span class="price">${item['参考售价 (BRL)'] || '0.00'}</span>
                </div>
                <div class="btn-group" style="display:flex; gap:10px; margin-top:15px;">
                    <a href="${item['参考商品链接 (SHP/AE/Amazon/独立站/...)'] || '#'}" target="_blank" 
                       style="flex:1; background:#ee4d2d; color:white; text-align:center; padding:8px; border-radius:4px; text-decoration:none; font-size:13px;">原品链接</a>
                    <button onclick="copyText('${item['参考图片']}')" 
                       style="flex:1; background:#f0f0f0; border:none; padding:8px; border-radius:4px; font-size:13px; cursor:pointer;">复制ID</button>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

// 筛选逻辑
function filterData() {
    const keyword = document.getElementById('searchInput').value.toLowerCase();
    const priority = document.getElementById('priorityFilter').value;
    const type = document.getElementById('typeFilter').value;

    const filtered = allData.filter(item => {
        const desc = (item['商品描述 (名称)'] || "").toLowerCase();
        const refId = (item['参考图片'] || "").toLowerCase();
        const matchKeyword = desc.includes(keyword) || refId.includes(keyword);
        const matchPriority = priority === "" || item.Priority === priority;
        const matchType = type === "" || item['建议卖家类型 (3PF/SLS/不限)'] === type;
        return matchKeyword && matchPriority && matchType;
    });

    renderCards(filtered);
    const countEl = document.getElementById('count');
    if (countEl) countEl.innerText = filtered.length;
}

// 复制
function copyText(text) {
    if(!text || text === 'undefined') return;
    navigator.clipboard.writeText(text).then(() => {
        const toast = document.getElementById('toast');
        if(toast) {
            toast.classList.remove('hidden');
            setTimeout(() => toast.classList.add('hidden'), 2000);
        }
    });
}

// 绑定事件
document.addEventListener('DOMContentLoaded', () => {
    init();
    const sInput = document.getElementById('searchInput');
    const pFilter = document.getElementById('priorityFilter');
    const tFilter = document.getElementById('typeFilter');
    const rBtn = document.getElementById('resetBtn');

    if(sInput) sInput.addEventListener('input', filterData);
    if(pFilter) pFilter.addEventListener('change', filterData);
    if(tFilter) tFilter.addEventListener('change', filterData);
    if(rBtn) rBtn.addEventListener('click', () => {
        sInput.value = "";
        pFilter.value = "";
        tFilter.value = "";
        renderCards(allData);
        document.getElementById('count').innerText = allData.length;
    });
});
