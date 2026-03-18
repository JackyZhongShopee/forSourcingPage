const EXCHANGE_RATE = { CNY: 1.42, USD: 0.20 };
let allData = [];

function getVal(item, keyPart) {
    const targetKey = Object.keys(item).find(k => k.trim().includes(keyPart));
    return (item[targetKey] || "").trim();
}

async function init() {
    // 默认标题，防止加载失败显示“加载中”
    document.title = "热销选品清单";
    
    try {
        const configRes = await fetch('./config.json');
        if (configRes.ok) {
            const config = await configRes.json();
            document.title = config.siteTitle;
            document.getElementById('siteTitle').innerText = config.siteTitle;
            document.getElementById('siteDesc').innerText = config.siteDesc;
        }

        Papa.parse('./data/selection.csv', {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                allData = results.data
                    .map(row => {
                        const n = {};
                        for (let k in row) n[k.trim()] = row[k];
                        return n;
                    })
                    .sort((a, b) => {
                        const pA = getVal(a, "Priority"), pB = getVal(b, "Priority");
                        if (pA !== pB) {
                            if (pA === "P0") return -1;
                            if (pB === "P0") return 1;
                            return pA.localeCompare(pB);
                        }
                        return 0;
                    });

                updateFilters(allData);
                renderCards(allData);
            }
        });
    } catch (err) { console.error("Data Load Error:", err); }
}

function updateFilters(data) {
    const selectors = {
        priorityFilter: "Priority",
        clusterFilter: "Cluster",
        l1Filter: "L1",
        l2Filter: "L2",
        typeFilter: "建议卖家类型"
    };

    for (let id in selectors) {
        const set = new Set();
        data.forEach(item => {
            const val = getVal(item, selectors[id]);
            if(val) set.add(val);
        });
        const el = document.getElementById(id);
        if (el && el.options.length <= 1) { // 避免重复添加
            Array.from(set).sort().forEach(v => el.add(new Option(v, v)));
        }
    }
}

function renderCards(data) {
    const grid = document.getElementById('productGrid');
    document.getElementById('count').innerText = data.length;
    
    grid.innerHTML = data.map(item => {
        const priority = getVal(item, "Priority") || "P2";
        const priceBRL = parseFloat(getVal(item, "参考售价 (BRL)")) || 0;
        const refUrl = getVal(item, "参考商品链接");
        const hasUrl = refUrl.length > 5;
        const title = getVal(item, "商品描述 (名称)");
        
        return `
        <div class="card ${priority}">
            <div class="img-container">
                <img class="card-img" src="${getVal(item, "参考图片链接")}" loading="lazy" onerror="this.src='https://via.placeholder.com/300?text=No+Image'">
            </div>
            <div class="card-content">
                <div class="category">${getVal(item, "L1")} > ${getVal(item, "L2")}</div>
                <div class="title-wrap">
                    <span class="p-tag">${priority}</span>
                    <span class="title-text">${title}</span>
                </div>
                <div class="price-section">
                    <div class="main-price">R$ ${priceBRL.toFixed(2)}</div>
                    <div class="sub-price">¥ ${(priceBRL * EXCHANGE_RATE.CNY).toFixed(2)} | $ ${(priceBRL * EXCHANGE_RATE.USD).toFixed(2)}</div>
                </div>
                <a href="${hasUrl ? refUrl : 'javascript:void(0)'}" 
                   class="btn-main ${hasUrl ? '' : 'disabled'}" 
                   target="_blank">参考链接</a>
            </div>
        </div>
        `;
    }).join('');
}

// 筛选逻辑保持不变...
function filterData() {
    const p = document.getElementById('priorityFilter').value;
    const c = document.getElementById('clusterFilter').value;
    const l1 = document.getElementById('l1Filter').value;
    const l2 = document.getElementById('l2Filter').value;
    const t = document.getElementById('typeFilter').value;

    const filtered = allData.filter(item => {
        return (p === "" || getVal(item, "Priority") === p) &&
               (c === "" || getVal(item, "Cluster") === c) &&
               (l1 === "" || getVal(item, "L1") === l1) &&
               (l2 === "" || getVal(item, "L2") === l2) &&
               (t === "" || getVal(item, "建议卖家类型") === t);
    });
    renderCards(filtered);
}

document.addEventListener('DOMContentLoaded', () => {
    init();
    ['priorityFilter', 'clusterFilter', 'l1Filter', 'l2Filter', 'typeFilter'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.addEventListener('change', filterData);
    });
    document.getElementById('resetBtn').addEventListener('click', () => window.location.reload());
});
