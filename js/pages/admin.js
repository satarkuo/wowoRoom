let orderData = [];
const orderTableTbody = document.querySelector('.orderPage-table tbody');
const deleteAllOrderBtn = document.querySelector('.discardAllBtn');
const orderStatus = document.querySelector('.orderStatus');


//取得訂單列表
const getOrderList = () => {
    axios.get(`${adminApi}/orders`, headers)
    .then((response) => {
        orderData = response.data.orders;
        orderData.sort((a,b) =>{
            return b.createdAt - a.createdAt
        })
        renderOrderList();
        chartProductCategory();
        chartProductTitle();
    })
    .catch((error) => {
        Toast.fire({
            icon: "error",
            title: "取得訂單列表失敗",
            text: error
          });
    });
}

//渲染訂單列表
const renderOrderList = () => {
    if(orderData.length == 0) {
        orderTableTbody.innerHTML = `<tr><td colspan="8" class="noData">沒有訂單</td></tr>`;
        deleteAllOrderBtn.classList.add('disabled');
        return;
    }
    orderTableTbody.innerHTML = orderData.map(item => renderOrderListHTML(item)).join('');
}
//渲染productCard HTML
const  renderOrderListHTML = (item) => {
    return `<tr data-id="${item.id}">
                    <td>${item.id}</td>
                    <td>
                      <p>${item.user.name}</p>
                      <p>${item.user.tel}</p>
                    </td>
                    <td>${item.user.address}</td>
                    <td>${item.user.email}</td>
                    <td>
                      ${item.products.map( product => `<p>${product.title}</p> x ${product.quantity}` ).join('')}
                    </td>
                    <td>${formatTime(item.createdAt)}</td>
                    <td >
                      <a href="#">${ item.paid ? '<span class="orderStatus status-done">已處理</span>' : '<span class="orderStatus status-undo">未處理</span>'}</a>
                    </td>
                    <td>
                      <input type="button" class="delSingleOrder-Btn" value="刪除">
                    </td>
                </tr>`
}

//timestamp
const formatTime = (timestamp) => {
    const time = new Date(timestamp * 1000);
    //寫法一
    return `${time.getFullYear()}/${String(time.getMonth()+1).padStart(2,0)}/${String(time.getDate()).padStart(2,0)} ${String(time.getHours()).padStart(2,0)}:${String(time.getMinutes()).padStart(2,0)}:${String(time.getSeconds()).padStart(2,0)}`
    //寫法二 
    // MDN：https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat
    // return time.toLocaleString('zh-Tw',{ //zh-Tw 地區時間
    //     hour12: false //取消12小時制
    // })
}

//刪除單筆訂單
const deleteSingleOrder = (id) => {
    axios.delete(`${adminApi}/orders/${id}`, headers)
    .then((response) => {
        Toast.fire({
            icon: "success",
            title: `訂單「${id}」已刪除`,
        });
        orderData = response.data.orders;
        renderOrderList();
    })
    .catch((error) => {
        Toast.fire({
            icon: "error",
            title: "訂單未正確刪除",
            text: error
          });
    });
}


//修改訂單狀態
const updateOrderStatus = (id) => {
    let result = {};
    orderData.forEach(order => {
        if(order.id ===id) {
            result = order;
        }
    })
    const data = {
        data: {
          id: id,
          paid: !result.paid,
        }
    };
    axios.put(`${adminApi}/orders`, data, headers)
    .then((response) => {
        Toast.fire({
            icon: "success",
            title: `訂單「${id}」狀態已變更`,
        });
        getOrderList();
    })
    .catch((error) => {
        Toast.fire({
            icon: "error",
            title: "訂單狀態變更失敗",
            text: error
          });
    });
}
//監聽：刪除單筆訂單、修改訂單狀態
orderTableTbody.addEventListener('click', (e) => {
    e.preventDefault();
    let orderId = e.target.closest('tr').getAttribute('data-id');
    //刪除單筆訂單
    if (e.target.classList.contains("delSingleOrder-Btn")) {
        deleteSingleOrder(orderId);
    }
    //修改訂單狀態
    if(e.target.classList.contains("orderStatus")) {
        updateOrderStatus(orderId);
    }

})
//清空訂單
const deleteOrderList = () => {
    axios.delete(`${adminApi}/orders`, headers)
    .then((response) => {
        Toast.fire({
            icon: "success",
            title: "訂單列表已清除",
          });
        getOrderList();
    })
    .catch((error) => {
        Toast.fire({
            icon: "error",
            title: "訂單清除失敗",
            text: error
          });
    });
}

//監聽：清空訂單
deleteAllOrderBtn.addEventListener('click', (e) => {
    e.preventDefault();
    deleteOrderList();
})

//取得圖表data：全產品類別營收比重
function chartProductCategory(){
    const resultObj = {};
    orderData.forEach(order => {
        order.products.forEach(product => {
            if (resultObj[product.category] === undefined) {
                resultObj[product.category] = product.price * product.quantity;
            } else {
                resultObj[product.category] += product.price * product.quantity;
            }
        })
    })
    renderChartCategory(Object.entries(resultObj));

}

//取得圖表data：全品項營收比重
function chartProductTitle(){
    const resultObj = {};
    orderData.forEach(order => {
        order.products.forEach(product => {
            if (resultObj[product.title] === undefined) {
                resultObj[product.title] = product.price * product.quantity;
            } else {
                resultObj[product.title] += product.price * product.quantity;
            }
        })
    })
    const resultArr = Object.entries(resultObj);
    const sortResultArr = resultArr.sort((a,b) => {
        return b[1] - a [1]
    })

    const rankOfThree = [];
    let otherTotal = 0;
    sortResultArr.forEach((product,index) => {
        if(index <= 2) {
            rankOfThree.push(product);
        } else if (index >2) {
            otherTotal += product[1];
        }
    })
    if(sortResultArr.length > 3) {
        rankOfThree.push(["其他", otherTotal]);
    }
    renderChartTitle(rankOfThree);

}

// 渲染圖表 C3.js
function renderChartCategory(data){
    let chart = c3.generate({
        bindto: '#chart', // HTML 元素綁定
        color: {
            pattern: ['#DACBFF', '#9D7FEA', '#5434A7', '#301E5F']
        },
        data: {
            type: "pie",
            columns: data
        },
    });
}

function renderChartTitle(data){
    let chart = c3.generate({
        bindto: '#chart2', // HTML 元素綁定
        color: {
            pattern: ['#DACBFF', '#9D7FEA', '#5434A7', '#301E5F']
        },
        data: {
            type: "pie",
            columns: data
        },
    });
}





//初始化
const init = () => {
    getOrderList();
}
init();


