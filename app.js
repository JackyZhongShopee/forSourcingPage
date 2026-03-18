// 汇率配置
const EXCHANGE_RATE = { CNY: 1.42, USD: 0.20 };
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
                // 过滤掉完全空的行
                allData = results.data.filter(item => item.Priority || item['商品描述 (名称)']);
                updateFilters(allData);
                renderCards(allData);
            }
        });
    } catch (err) { console.error("Initialization failed", err); }
}

function updateFilters(data) {
    const pSet = new Set(), l1Set = new Set(), l2Set = new Set();
    data.forEach(item => {
        if(item.Priority) pSet.add(item.Priority);
        if(item.L1) l1Set.add(item.L1);
        if(item.L2) l2Set.add(item.L2);
    });

    const populate = (id, set) => {
        const el = document.getElementById(id);
        Array.from(set).sort().forEach(val => el.add(new Option(val, val)));
    };
    populate('priorityFilter', pSet);
    populate('l1Filter', l1Set);
    populate('l2Filter', l2Set);
}

function renderCards(data) {
    const grid = document.getElementById('productGrid');
    document.getElementById('count').innerText = data.length;
    
    grid.innerHTML = data.map(item => {
        const imgUrl = item['参考图片链接'] || '';
        const priceBRL = parseFloat(item['参考售价 (BRL)']) || 0;
        const refUrl = item['参考商品链接 (SHP/AE/Amazon/独立站/...)'] || '';
        const hasUrl = refUrl.trim().length > 5; // 简单判断链接是否有效
        
        // 只有有描述时才渲染标题
        const titleHtml = item['商品描述 (名称)'] ? `<div class="title">${item['商品描述 (名称)']}</div>` : '';
        
        return `
        <div class="card ${item.Priority || ''}">
            <div class="priority-badge">${item.Priority || 'P2'}</div>
            <div class="img-container" onclick="copyID('${item['参考图片']}')">
                <img class="card-img" src="${imgUrl}" loading="lazy" onerror="this.src='https://via.placeholder.com/200?text=Error'">
            </div>
            <div class="card-content">
                <div class="category">${item.L1 || ''} ${item.L2 ? ' > ' + item.L2 : ''}</div>
                ${titleHtml}
                <div class="price-section">
                    <div class="main-price"><small>建议售价</small> R$ ${priceBRL.toFixed(2)}</div>
                    <div class="sub-price">
                        约 ¥ ${(priceBRL * EXCHANGE_RATE.CNY).toFixed(2)} | $ ${(priceBRL * EXCHANGE_RATE.USD).toFixed(2)}
                    </div>
                </div>
                <div class="tags">
                    ${item.Cluster ? `<span class="tag">${item.Cluster}</span>` : ''}
                    ${item['建议卖家类型 (3PF/SLS/不限)'] ? `<span class="tag">${item['建议卖家类型 (3PF/SLS/不限)']}</span>` : ''}
                </div>
                <a href="${hasUrl ? refUrl : 'javascript:void(0)'}" 
                   class="btn-main ${hasUrl ? '' : 'disabled'}" 
                   target="_blank">参考链接</a>
            </div>
        </div>
        `;
    }).join('');
}

function filterData() {
    const kw = document.getElementById('searchInput').value.toLowerCase();
    const p = document.getElementById('priorityFilter').value;
    const l1 = document.getElementById('l1Filter').value;
    const l2 = document.getElementById('l2Filter').value;

    const filtered = allData.filter(item => {
        const mKw = (item['商品描述 (名称)'] || '').toLowerCase().includes(kw) || (item['参考图片'] || '').toLowerCase().includes(kw);
        const mP = p === "" || item.Priority === p;
        const mL1 = l1 === "" || item.L1 === l1;
        const mL2 = l2 === "" || item.L2 === l2;
        return mKw && mP && mL1 && mL2;
    });
    renderCards(filtered);
}

function copyID(text) {
    if(!text || text === 'undefined') return;
    navigator.clipboard.writeText(text).then(() => {
        const t = document.getElementById('toast');
        t.classList.remove('hidden');
        setTimeout(() => t.classList.add('hidden'), 1500);
    });
}

// 事件绑定
document.addEventListener('DOMContentLoaded', () => {
    init();
    ['searchInput', 'priorityFilter', 'l1Filter', 'l2Filter'].forEach(id => {
        document.getElementById(id).addEventListener('input', filterData);
    });
    document.getElementById('resetBtn').addEventListener('click', () => {
        window.location.reload(); // 重置最简单的方法是刷新
    });
});
