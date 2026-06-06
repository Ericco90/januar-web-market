// File: backend.gs
// Deploy as Web App, execute as "Me", accessible to "Anyone"

const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'getProducts') {
    return jsonResponse(getProducts());
  } else if (action === 'getTestimonials') {
    return jsonResponse(getTestimonials());
  } else if (action === 'getSettings') {
    return jsonResponse(getSettingsPublic());
  } else if (action === 'adminGetOrders') {
    return jsonResponse(getOrders(e.parameter.token)); // very basic token check
  } else if (action === 'setup') {
    return jsonResponse(initSetup());
  }
  
  return jsonResponse({status: 'error', message: 'Unknown action'});
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    if (action === 'createOrder') {
      return jsonResponse(createOrder(data.payload));
    } else if (action === 'adminLogin') {
      return jsonResponse(adminLogin(data.payload));
    } else if (action === 'adminAddProduct') {
      return jsonResponse(addProduct(data.payload, data.token));
    } else if (action === 'adminUpdateProduct') {
      return jsonResponse(updateProduct(data.payload, data.token));
    } else if (action === 'adminDeleteProduct') {
      return jsonResponse(deleteProduct(data.payload, data.token));
    }
    
    return jsonResponse({status: 'error', message: 'Unknown action'});
  } catch (error) {
    return jsonResponse({status: 'error', message: error.toString()});
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ================= DATABASE HELPERS =================

function getSheetData(sheetName) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  const headers = data[0];
  const result = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }
    result.push(obj);
  }
  return result;
}

// ================= ENDPOINTS =================

function getProducts() {
  const products = getSheetData('Produk');
  // Filter only active for public, or handle status
  return {status: 'success', data: products};
}

function getTestimonials() {
  return {status: 'success', data: getSheetData('Testimoni')};
}

function getSettingsPublic() {
  const settings = getSheetData('Pengaturan');
  const publicSettings = {};
  settings.forEach(s => {
    if(s.key !== 'Midtrans_Server_Key' && s.key !== 'Midtrans_Client_Key') {
      publicSettings[s.key] = s.value;
    }
  });
  return {status: 'success', data: publicSettings};
}

function getSetting(key) {
  const settings = getSheetData('Pengaturan');
  const item = settings.find(s => s.key === key);
  return item ? item.value : null;
}

function createOrder(payload) {
  // payload: { productId, name, email, wa, price, productName }
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Order');
  const orderId = 'ORD-' + new Date().getTime();
  const date = new Date().toISOString();
  
  sheet.appendRow([orderId, date, payload.name, payload.email, payload.wa, payload.productName, payload.price, 'Menunggu Pembayaran']);
  
  // Create Midtrans Transaction
  const midtransResult = createMidtransTransaction(orderId, payload.price, payload.productName, payload.name, payload.email, payload.wa);
  
  return {
    status: 'success', 
    data: {
      orderId: orderId,
      snapToken: midtransResult.token,
      redirectUrl: midtransResult.redirect_url
    }
  };
}

function createMidtransTransaction(orderId, price, productName, name, email, phone) {
  const serverKey = getSetting('Midtrans_Server_Key');
  const isProduction = getSetting('Midtrans_Is_Production') === 'TRUE';
  
  const url = isProduction ? 'https://app.midtrans.com/snap/v1/transactions' : 'https://app.sandbox.midtrans.com/snap/v1/transactions';
  
  const payload = {
    "transaction_details": {
      "order_id": orderId,
      "gross_amount": parseInt(price)
    },
    "customer_details": {
      "first_name": name,
      "email": email,
      "phone": phone
    },
    "item_details": [
      {
        "id": "ITEM1",
        "price": parseInt(price),
        "quantity": 1,
        "name": productName
      }
    ]
  };
  
  const encodedKey = Utilities.base64Encode(serverKey + ':');
  
  const options = {
    'method': 'post',
    'contentType': 'application/json',
    'headers': {
      'Authorization': 'Basic ' + encodedKey,
      'Accept': 'application/json'
    },
    'payload': JSON.stringify(payload)
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    return JSON.parse(response.getContentText());
  } catch (e) {
    Logger.log(e);
    return { token: null, error: e.toString() };
  }
}

// ================= ADMIN ENDPOINTS =================

function adminLogin(payload) {
  const admins = getSheetData('Admin');
  const user = admins.find(a => a.username === payload.username && a.password === payload.password);
  
  if (user) {
    // Generate simple token (in real app, use JWT or proper session)
    const token = Utilities.base64Encode(payload.username + '_' + new Date().getTime());
    return {status: 'success', token: token};
  } else {
    return {status: 'error', message: 'Invalid credentials'};
  }
}

function checkAdminToken(token) {
  // Simple check for demo purpose
  return token && token.length > 5;
}

function uploadImageToDrive(base64Data, mimeType, fileName) {
  const folderId = getSetting('Drive_Folder_ID');
  if (!folderId) throw new Error("Drive_Folder_ID belum diatur di sheet Pengaturan. Silakan tambahkan ID folder Google Drive Anda.");
  
  const folder = DriveApp.getFolderById(folderId);
  const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, fileName);
  const file = folder.createFile(blob);
  
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return 'https://drive.google.com/uc?export=view&id=' + file.getId();
}

function addProduct(payload, token) {
  if(!checkAdminToken(token)) return {status: 'error', message: 'Unauthorized'};
  
  let thumbnailUrl = payload.thumbnail;
  if(payload.imageBase64) {
    thumbnailUrl = uploadImageToDrive(payload.imageBase64, payload.imageMimeType, payload.imageName);
  }

  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Produk');
  const id = 'PRD-' + new Date().getTime();
  sheet.appendRow([id, payload.nama, payload.kategori, payload.harga, payload.deskripsi, thumbnailUrl, payload.file, payload.status || 'Aktif']);
  return {status: 'success', message: 'Produk ditambahkan'};
}

function updateProduct(payload, token) {
  if(!checkAdminToken(token)) return {status: 'error', message: 'Unauthorized'};
  
  let thumbnailUrl = payload.thumbnail;
  if(payload.imageBase64) {
    thumbnailUrl = uploadImageToDrive(payload.imageBase64, payload.imageMimeType, payload.imageName);
  }

  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Produk');
  const data = sheet.getDataRange().getValues();
  for(let i = 1; i < data.length; i++) {
    if(data[i][0] === payload.id) {
      sheet.getRange(i+1, 2, 1, 7).setValues([[payload.nama, payload.kategori, payload.harga, payload.deskripsi, thumbnailUrl, payload.file, payload.status]]);
      return {status: 'success', message: 'Produk diupdate'};
    }
  }
  return {status: 'error', message: 'Produk tidak ditemukan'};
}

function deleteProduct(payload, token) {
  if(!checkAdminToken(token)) return {status: 'error', message: 'Unauthorized'};
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Produk');
  const data = sheet.getDataRange().getValues();
  for(let i = 1; i < data.length; i++) {
    if(data[i][0] === payload.id) {
      sheet.deleteRow(i+1);
      return {status: 'success', message: 'Produk dihapus'};
    }
  }
  return {status: 'error', message: 'Produk tidak ditemukan'};
}

function getOrders(token) {
  if(!checkAdminToken(token)) return {status: 'error', message: 'Unauthorized'};
  return getSheetData('Order');
}

// Note: Ensure the spreadsheet has sheets exactly named: "Produk", "Order", "Testimoni", "Admin", "Pengaturan"

// ================= SETUP UTILITY =================

function initSetup() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    const sheetsConfig = {
      'Produk': ['id', 'nama', 'kategori', 'harga', 'deskripsi', 'thumbnail', 'file', 'status'],
      'Order': ['id', 'tanggal', 'nama', 'email', 'wa', 'produk', 'harga', 'status'],
      'Testimoni': ['nama', 'foto', 'isi'],
      'Admin': ['username', 'password'],
      'Pengaturan': ['key', 'value']
    };
    
    for (const sheetName in sheetsConfig) {
      let sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
        sheet.appendRow(sheetsConfig[sheetName]);
        
        if (sheetName === 'Admin') {
          sheet.appendRow(['admin', 'admin123']);
        } else if (sheetName === 'Pengaturan') {
          sheet.appendRow(['Midtrans_Server_Key', 'SB-Mid-server-xxxxxxxxxxxx']);
          sheet.appendRow(['Midtrans_Client_Key', 'SB-Mid-client-xxxxxxxxxxxx']);
          sheet.appendRow(['Midtrans_Is_Production', 'FALSE']);
          sheet.appendRow(['Drive_Folder_ID', 'ISI_DENGAN_ID_FOLDER_GOOGLE_DRIVE']);
        }
      } else {
        if (sheet.getLastRow() === 0) {
          sheet.appendRow(sheetsConfig[sheetName]);
        }
      }
    }
    return {status: 'success', message: 'Setup sheet dan header berhasil dilakukan.'};
  } catch (error) {
    return {status: 'error', message: error.toString()};
  }
}
