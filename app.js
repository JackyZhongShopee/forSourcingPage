// 假设汇率（你可以根据实时情况调整）
const BRL_TO_CNY = 1.42;
const BRL_TO_USD = 0.20;

let allData = [];

async function init() {
    try {
        const configRes = await fetch('./config.json');
        const config = await configRes.json();
        document.title = config.siteTitle;
        document.getElementById('siteTitle').innerText = config.siteTitle;
        document.getElementById('siteDesc').innerText = config.siteDesc;

        Papa.parse('./data/selection.csv', {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                allData = results.data;
                updateFilterOptions(allData); // 动态生成L1, L2选项
                renderCards(allData);
            }
        });
    } catch (err) { console.error("初始化失败", err); }
}

// 动态填充 L1 和 L2 的下拉框
function updateFilterOptions(data) {
    const l1Set = new Set();
    const l2Set = new Set();
    data.forEach(item => {
        if(item.L1) l1Set.add(item.L1);
        if(item.L2) l2Set.add(item.L2);
    });

    const l1Select = document.getElementById('l1Filter');
    const l2Select = document.getElementById('l2Filter');
    
    l1Set.forEach(val => l1Select.add(new Option(val, val)));
    l2Set.forEach(val => l2Select.add(new Option(val, val)));
}

function renderCards(data) {
    const grid = document.getElementById('productGrid');
    document.getElementById('count').innerText = data.length;
    
    grid.innerHTML = data.map(item => {
        const imgUrl = item['参考图片链接'] || '';
        const rawPrice = parseFloat(item['参考售价 (BRL)']) || 0;
        const targetUrl = item['参考商品链接 (SHP/AE/Amazon/独立站/...)'];
        const hasUrl = targetUrl && targetUrl.trim() !== "";
        
        // 只有当有描述时才显示标题
        const titleHtml = item['商品描述 (名称)'] ? `<div class="title">${item['商品描述 (名称)']}</div>` : '';
        
        return `
        <div class="card ${item.Priority}">
            <div class="priority-badge">${item.Priority || 'P2'}</div>
            <div class="img-container">
                <img class="card-img" src="${imgUrl}" loading="lazy" onerror="this.src='https://via.placeholder.com/200?text=No+Image'">
            </div>
            <div class="card-content">
                <div class="category">${item.L1 || ''} ${item.L2 ? ' > ' + item.L2 : ''}</div>
                ${titleHtml}
                <div class="price-section">
                    <div class="main-price">建议售价 R$ ${rawPrice.toFixed(2)}</div>
                    <div class="sub-price">
                        约 ¥ ${(rawPrice * BRL_TO_CNY).toFixed(2)} | $ ${(rawPrice * BRL_TO_USD).toFixed(2)}
                    </div>
                </div>
                <div class="tags">
                    <span class="tag">${item.Cluster || ''}</span>
                    <span class="tag">${item['建议卖家类型 (3PF/SLS/不限)'] || ''}</span>
                </div>
                <div class="btn-group">
                    <a href="${hasUrl ? targetUrl : 'javascript:void(0)'}" 
                       class="btn-main ${hasUrl ? '' : 'disabled'}" 
                       target="${hasUrl ? '_blank' : '_self'}">
                       参考链接
                    </a>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

// 筛选逻辑增加 L1 和 L2
function filterData() {
    const keyword = document.getElementById('searchInput').value.toLowerCase();
    const priority = document.getElementById('priorityFilter').value;
    const l1 = document.getElementById('l1Filter').value;
    const l2 = document.getElementById('l2Filter').value;

    const filtered = allData.filter(item => {
        const matchKeyword = (item['商品描述 (名称)'] || "").toLowerCase().includes(keyword);
        const matchPriority = priority === "" || item.Priority === priority;
        const matchL1 = l1 === "" || item.L1 === l1;
        const matchL2 = l2 === "" || item.L2 === l2;
        return matchKeyword && matchPriority && matchL1 && matchL2;
    });
    renderCards(filtered);
}

// 绑定事件 (需在 HTML 中添加对应的 ID)
