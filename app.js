let allData = [];

// 初始化：加载配置和数据
async function init() {
    try {
        console.log("开始加载配置文件...");
        const configRes = await fetch('./config.json');
        const config = await configRes.json();
        document.title = config.siteTitle;
        document.getElementById('siteTitle').innerText = config.siteTitle;
        document.getElementById('siteDesc').innerText = config.siteDesc;

        console.log("开始解析 CSV 数据...");
        // 关键修改：显式处理路径和跨域
        Papa.parse('./data/selection.csv', {
            download: true,
            header: true,
            skipEmptyLines: true,
            encoding: "UTF-8", // 强制 UTF-8 编码
            complete: function(results) {
                console.log("解析完成，行数:", results.data.length);
                if (results.data.length === 0) {
                    console.error("CSV 文件可能是空的或路径错误");
                }
                allData = results.data;
                renderCards(allData);
                document.getElementById('count').innerText = allData.length;
            },
            error: function(err) {
                console.error("CSV 解析出错:", err);
            }
        });
    } catch (err) {
        console.error("初始化流程出错 (可能是跨域或文件缺失):", err);
    }
}

// 渲染函数：针对图片 URL 做了强化
function renderCards(data) {
    const grid = document.getElementById('productGrid');
    if (!data || data.length === 0) {
        grid.innerHTML = '<div class="loading">暂无符合条件的数据</div>';
        return;
    }

    grid.innerHTML = data.map(item => {
        // 容错处理：如果没写图片 URL，给一个默认占位图
        const imgUrl = item['参考图片链接'] || 'https://via.placeholder.com/400?text=No+Image';
        
        return `
        <div class="card ${item.Priority}">
            <div class="priority-badge">${item.Priority}</div>
            <div class="img-container">
                <img class="card-img" src="${imgUrl}" alt="商品图" 
                     onerror="this.src='https://via.placeholder.com/400?text=Image+Load+Error'">
            </div>
            <div class="card-content">
                <div class="category">${item.L1 || ''} > ${item.L2 || ''}</div>
                <div class="title">${item['商品描述 (名称)'] || '未命名商品'}</div>
                <div class="price-row">
                    <span>R$</span>
                    <span class="price">${item['参考售价 (BRL)'] || '0.00'}</span>
                </div>
                <div class="tags">
                    <span class="tag">${item.Cluster || '默认'}</span>
                    <span class="tag">${item['建议卖家类型 (3PF/SLS/不限)'] || '不限'}</span>
                </div>
                <div class="btn-group">
                    <a href="${item['参考商品链接 (SHP/AE/Amazon/独立站/...)']}" target="_blank" class="btn-main">原品链接</a>
                    <button onclick="copyText('${item['参考图片']}')" class="btn-sub">复制图片ID</button>
                </div>
            </div>
        </div>
    `}).join('');
}

// 其余筛选和复制函数保持不变...
// (省略 filterData 和 copyText 函数内容，确保它们仍在你的文件里)

init();
