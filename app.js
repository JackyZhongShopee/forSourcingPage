let allData = [];

// 1. 初始化：加载配置和数据
async function init() {
    try {
        console.log("正在加载配置...");
        const configRes = await fetch('./config.json');
        const config = await configRes.json();
        document.title = config.siteTitle;
        document.getElementById('siteTitle').innerText = config.siteTitle;
        document.getElementById('siteDesc').innerText = config.siteDesc;

        console.log("正在解析 CSV...");
        Papa.parse('./data/selection.csv', {
            download: true,
            header: true,
            skipEmptyLines: true,
            encoding: "UTF-8",
            complete: function(results) {
                console.log("解析成功，数据量:", results.data.length);
                allData = results.data;
                
                // 修复点：直接调用渲染和统计，移除未定义的 setupFilters
                renderCards(allData);
                updateCount(allData.length);
            },
            error: function(err) {
                console.error("CSV 解析失败:", err);
            }
        });
    } catch (err) {
        console.error("初始化出错:", err);
    }
}

// 2. 渲染卡片函数
function renderCards(data) {
    const grid = document.getElementById('productGrid');
    if (!data || data.length === 0) {
        grid.innerHTML = '<div class="loading">没有找到匹配的商品。</div>';
        return;
    }

    grid.innerHTML = data.map(item => {
        // 动态读取图片 URL，如果没有则显示占位图
        const imgUrl = item['参考图片链接'] || 'https://via.placeholder.com/400?text=No+Image';
        
        return `
        <div class="card ${item.Priority}">
            <div class="priority-badge">${item.Priority}</div>
            <div class="img-container">
                <img class="card-img" src="${imgUrl}" alt="商品图" 
                     onerror="this.src='https://via.placeholder.com/400?text=Image+Error'">
            </div>
            <div class="card-content">
                <div class="category">${item.L1 || ''} > ${item.L2 || ''}</div>
                <div class="title">${item['商品描述 (名称)'] || '未命名商品'}</div>
                <div class="price-row">
                    <span>R$</span>
                    <span class="price">${item['参考售价 (BRL)'] || '0.00'}</span>
                </div>
                <div class="tags">
                    <span class="tag">${item.Cluster || '-'}</span>
                    <span class="tag">${item['建议卖家类型 (3PF/SLS/不限)'] || '不限'}</span>
                </div>
                <div class="btn-group">
                    <a href="${item['参考商品链接 (SHP/AE/Amazon/独立站/...)']}" target="_blank" class="btn-main">原品链接</a>
                    <button onclick="copyText('${item['参考图片']}')" class="btn-sub">复制ID</button>
                </div>
            </div>
        </div>
    `;
    }).join('');
}

// 3. 筛选逻辑
function filterData() {
    const keyword = document.getElementById('searchInput').value.toLowerCase();
    const priority = document.getElementById('priorityFilter').value;
    const type = document.getElementById('typeFilter').value;

    const filtered = allData.filter(item => {
        // 确保字段存在再进行比较，防止报错
        const desc = (item['商品描述 (名称)'] || "").toLowerCase();
        const refId = (item['参考图片'] || "").toLowerCase();
        
        const matchKeyword = desc.includes(keyword) || refId.includes(keyword);
        const matchPriority = priority === "" || item.Priority === priority;
        const matchType = type === "" || item['建议卖家类型 (3PF/SLS/不限)'] === type;
        
        return matchKeyword && matchPriority && matchType;
    });

    renderCards(filtered);
    updateCount(filtered.length);
}

// 4. 更新计数器
function updateCount(num) {
    const countEl = document.getElementById('count');
    if (countEl) countEl.innerText = num;
}

// 5. 复制功能
function copyText(text) {
    if (!text || text === 'undefined') {
        alert("无有效 ID 可复制");
        return;
    }
    navigator.clipboard.writeText(text).then(() => {
        const toast = document.getElementById('toast');
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 2000);
    }).catch(err => {
        console.error('复制失败:', err);
    });
}

// 6. 事件监听绑定
document.getElementById('searchInput').addEventListener('input', filterData);
document.getElementById('priorityFilter').addEventListener('change', filterData);
document.getElementById('typeFilter').addEventListener('change', filterData);
document.getElementById('resetBtn').addEventListener('click', () => {
    document.getElementById('searchInput').value = "";
    document.getElementById('priorityFilter').value = "";
    document.getElementById('typeFilter').value = "";
    renderCards(allData);
    updateCount(allData.length);
});

// 执行初始化
init();
