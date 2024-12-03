let productData = [];
const productList = document.querySelector(".productWrap");
const productSelect = document.querySelector(".productSelect");
let cartData = [];
let cartTotalData = 0;
const cartTableTbody = document.querySelector(".shoppingCart-table tbody");
const deleteAllProducts = document.querySelector(".discardAllBtn");
const cartTotal = document.querySelector(".cartTotal");
const sendOrderBtn = document.querySelector(".orderInfo-btn");
const orderInfoForm = document.querySelector('.orderInfo-form');



//取得產品列表
const getProductList = () => {
    axios.get(`${customerApi}/products`)
    .then((response) => {
        productData = response.data.products;
        renderProduct();
    })
    .catch((error) => {
        Toast.fire({
            icon: "error",
            title: "取得產品列表失敗",
            text: error
          });
    });
}

//渲染產品列表
const renderProduct = () => {
    productList.innerHTML = productData.map(item => renderProductHTML(item)).join('');
}

//渲染productCard HTML
const  renderProductHTML = (item) => {
    return `<li class="productCard" >
                <h4 class="productType">新品</h4>
                <img src="${item.images}" alt="">
                <a href="#" data-id="${item.id}" data-name="${item.title}" class="addCardBtn">加入購物車</a>
                <h3>${item.title}</h3>
                <del class="originPrice">NT$${formatNumber(item.origin_price)}</del>
                <p class="nowPrice">NT$${formatNumber(item.price)}</p>
            </li>`
}

//產品分類篩選邏輯
productSelect.addEventListener("change", (e) => {
    productList.innerHTML = productData
        .filter(item => productSelect.value === "全部" || productSelect.value === item.category )
        .map(item => renderProductHTML(item)).join('');
})

//金額顯示千分位符號 1000 → 1,000
const formatNumber = (number) => {
    let parts = number.toString().split('.'); // 分割整數和小數部分
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ','); // 格式化整數部分
    return parts.length > 1 ? parts.join('.') : parts[0]; // 拼接小數部分
}

//取得購物車列表
const getCartList = () => {
    axios.get(`${customerApi}/carts`)
    .then((response) => {
        cartData = response.data.carts;
        cartTotalData = response.data.finalTotal;
        renderCartTable();
    })
    .catch((error) => {
        Toast.fire({
            icon: "error",
            title: "取得購物車列表失敗",
            text: error
          });
    });
}



//渲染購物車列表
const renderCartTable = () => {
    if(cartData.length == 0) {
        cartTableTbody.innerHTML = `<tr><td colspan="5" class="noData">購物車沒有商品</td></tr>`;
        deleteAllProducts.classList.remove('active');
        cartTotal.innerHTML = `NT$${formatNumber(cartTotalData)}`;
        sendOrderBtn.classList.add('disabled');
        return;
    }
    sendOrderBtn.classList.remove('disabled');
    deleteAllProducts.classList.add('active');
    cartTableTbody.innerHTML = cartData.map(item => renderCartTableHTML(item)).join('');
    cartTotal.innerHTML = `NT$${formatNumber(cartTotalData)}`;
}

//渲染cartTable HTML
const renderCartTableHTML =  (item) => {
    let total = item.product.price * item.quantity;
    return `<tr>
                <td>
                    <div class="cardItem-title">
                        <img src="${item.product.images}" alt="">
                        <p>${item.product.title}</p>
                    </div>
                </td>
                <td>NT$${formatNumber(item.product.price)}</td>
                <td>${item.quantity}</td>
                <td>NT$${formatNumber(total)}</td>
                <td class="discardBtn">
                    <a href="#" class="material-icons deleteBtn" data-cartId="${item.id}" data-title="${item.product.title}" >
                        clear
                    </a>
                </td>
            </tr>`
}

//加入購物車
const addCartItem = (id,name) => {

    //判斷產品數量，預設為1，若購物車已有此產品則累加數量
    let num = 1;
    cartData.forEach((item) => {
        if (item.product.id === id) {
            num = item.quantity+1;
        } 
    })
    const data = {
        data: {
            productId: id,
            quantity: num
        }
    }

    // post api    
    axios.post(`${customerApi}/carts`,data)
    .then((response) => {
        Toast.fire({
            icon: "success",
            title: `產品已加入購物車`,
            text: `${name}  ( 總數量：${num} )`,
          });
        getCartList();
    })
    .catch((error) => {
        Toast.fire({
            icon: "error",
            title: "加入購物車失敗",
            text: error
          });
    });
}

//監聽加入購物車按鈕
productList.addEventListener('click', (e) => {
    e.preventDefault();
    if(e.target.classList.contains('addCardBtn')){
        const productId = e.target.getAttribute('data-id');
        const productName = e.target.getAttribute('data-name');
        addCartItem(productId,productName);
    }
})

//清空購物車
const deleteCartList = () => {
    axios.delete(`${customerApi}/carts`)
    .then((response) => {
        Toast.fire({
            icon: "success",
            title: "購物車已清空",
          });
        getCartList();
    })
    .catch((error) => {
        Toast.fire({
            icon: "error",
            title: "購物車清空失敗",
            text: error
          });
    });
}

//監聽：刪除所有品項按鈕(清空購物車)
deleteAllProducts.addEventListener('click', (e) => {
    e.preventDefault();
    deleteCartList();
})

//購物車刪除單一產品
const deleteCartProduct = (id,name) => {
    axios.delete(`${customerApi}/carts/${id}`)
    .then((response) => {
        Toast.fire({
            icon: "success",
            title: `產品「${name}」已從移除購物車`,
          });
        getCartList();
    })
    .catch((error) => {
        Toast.fire({
            icon: "error",
            title: "產品未正確移除",
            text: error
          });
    });
}
//監聽：購物車刪除單一產品
cartTableTbody.addEventListener('click', (e) => {
    e.preventDefault();
    if(e.target.classList.contains('deleteBtn')){
        const cartId = e.target.getAttribute('data-cartId');
        const productName = e.target.getAttribute('data-title');
        deleteCartProduct(cartId,productName);
    }
})

//驗證表單
const checkForm = () => {
    const constraints = {
        姓名: {
          presence: { message: "^必填" },
        },
        電話: {
          presence: { message: "^必填" },
        },
        Email: {
          presence: { message: "^必填" },
          email: { message: "^請輸入正確的信箱格式" },
        },
        寄送地址: {
          presence: { message: "^必填" },
        },
    };
    const error = validate(orderInfoForm, constraints); // validate(驗證的表單,規則)
    // console.log(error);
    // {
    //     "姓名": [
    //         "必填"
    //     ],
    //     "電話": [
    //         "必填"
    //     ],
    //     "Email": [
    //         "必填"
    //     ],
    //     "寄送地址": [
    //         "必填"
    //     ]
    // }
}

//送出訂單
const sendOrder = () => {
    if(cartData.length === 0){
        Toast.fire({
            icon: "error",
            title: "購物車沒有商品",
            text: error
        });
        return;
    }
    if(checkForm()){
        Toast.fire({
            icon: "error",
            title: "表單未填寫完整",
            text: error
        });
        return;
    }
    const customerName = document.querySelector("#customerName");
    const customerPhone = document.querySelector("#customerPhone");
    const customerEmail = document.querySelector("#customerEmail");
    const customerAddress = document.querySelector("#customerAddress");
    const tradeWay = document.querySelector("#tradeWay");

    const data = {
        data: {
            user: {
            name: customerName.value.trim(),
            tel: customerPhone.value.trim(),
            email: customerEmail.value.trim(),
            address: customerAddress.value.trim(),
            payment: tradeWay.value,
            },
        },
    };
    // post api    
    axios.post(`${customerApi}/orders`,data)
    .then((response) => {
        Toast.fire({
            icon: "success",
            title: `訂單已送出`,
          });
        init();
        orderInfoForm.reset();
    })
    .catch((error) => {
        Toast.fire({
            icon: "error",
            title: "訂單送出失敗",
            text: error
          });
    });
}

sendOrderBtn.addEventListener('click',(e) => {
    e.preventDefault();
    sendOrder();
})

//初始化
const init = () => {
    getProductList();
    productSelect.value = "全部"; //預設篩選器顯示全部
    getCartList();
}
init();

