<template>
  <div>
    <el-upload
      class="upload-demo"
      action=""
      :auto-upload="false"
      :show-file-list="false"
      :on-change="handleImport"
      accept=".xlsx, .xls"
    >
      <el-button type="primary">导入Excel文件</el-button>
    </el-upload>
  </div>
  <div style="display: flex; align-items: center;">
    <el-select style="width: 160px;" v-model="selectedSheet" @change="handleSheetChange" placeholder="请选择Sheet">
      <el-option v-for="sheet in sheetNames" :key="sheet" :value="sheet">{{ sheet }}</el-option>
    </el-select>
    <el-button type="primary" @click="exportExcel">导出</el-button>

  </div>

  <el-row :gutter="20">
    <el-col :span="16">
      <el-table :data="tableData" max-height="400" :cell-style="getCellStyle" border show-summary style="width: 100%">
        <el-table-column prop="城市" label="城市" width="100" />
        <el-table-column prop="门店名称" label="门店名称"  width="200"/>
        <el-table-column prop="商品名称" label="商品名称" />
        <el-table-column prop="店品条数" label="店品条数" width="100" />
        <el-table-column prop="购买数量" label="购买数量" width="100" />
      </el-table>
    </el-col>
    <el-col :span="8" v-if="errorList.length > 0">
      <el-table :data="errorList" border style="width: 100%">
        <el-table-column prop="城市" label="城市" width="90" />
        <el-table-column prop="门店名称" label="门店名称"   />
        <el-table-column prop="多买的品种" label="多买的品种"/>
        <el-table-column prop="多买数量" label="多买数量" width="100" />
      </el-table>
    </el-col>
  </el-row>
</template>

<script setup>
import { ref } from "vue";
import { read, writeFileXLSX, utils } from "xlsx";
import { ElMessage } from "element-plus";
import { getCell } from "element-plus/es/components/table/src/util.mjs";
import { exportExcelWithExcelJS } from "@/utils/exceljsExport";
import Decimal from 'decimal.js';
const tableHeaders = ref([]);
const errorList = ref([]);

const tableData = ref();
const realBuyTable = ref()
const selectedSheet = ref('');
const sheetNames = ref([]);
const readSheetResult = ref({});
// 处理文件导入
const handleImport = (file) => {
  errorList.value = [];
  // 检查文件类型
  const isExcel = /\.(xlsx|xls)$/.test(file.name);
  if (!isExcel) {
    ElMessage.error("只能上传Excel文件!");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    fileReadFuc(e);
  };
  reader.readAsArrayBuffer(file.raw);
};

const fileReadFuc = (e) => {
  try {
      let result = {}
      const data = new Uint8Array(e.target.result);
      const workbook = read(data, { type: "array" });
      console.log('output->workbook.SheetNames',workbook.SheetNames);
      let realBuyIndex = workbook.SheetNames.indexOf(p => p == '购买明细');
      if (realBuyIndex != -1) {
        throw new Error('必须添加购买明细Sheet页');
      }
      const realBuyWorksheet = workbook.Sheets['购买明细'];
      const realBuyJsonData = utils.sheet_to_json(realBuyWorksheet, { header: 1 });
      result['购买明细'] = handleSheetData(realBuyJsonData, '购买明细');
      let otherSheetNames = workbook.SheetNames.filter(name => name != '购买明细');
      for (let index = 0; index < otherSheetNames.length; index++) {
        const el = otherSheetNames[index];
        console.log('output->城市', el);
        const worksheet = workbook.Sheets[el];
        // 转换JSON数据
        const jsonData = utils.sheet_to_json(worksheet, { header: 1 });
        if (el != '购买明细') {
          sheetNames.value.push(el);
          result[el] = handleSheetData(jsonData, el);
          result[el] = handleCompareTableData(result[el], result['购买明细']);
        }
        if (index == 0) {
          selectedSheet.value = el;
          tableData.value = result[selectedSheet.value];
        }
      }
      readSheetResult.value = result;
      console.log('output->result', result);
      // handleCompareTableData()
      ElMessage.success("文件导入成功");
    } catch (error) {
      console.log('output->error',error);
      ElMessage.error("文件解析失败: " + error.message);
    }
}
const handleSheetData = (jsonData, sheetName) => {
  let result = []
  const tableHeaders = jsonData[0];
  if(sheetName == '购买明细') {
    // 处理表格内容（跳过表头）
    result = jsonData.slice(1).map((row) => {
      return tableHeaders.reduce((obj, header, index) => {
        obj[header] = row[index] || "";
        if(header === '购买数量') {
          obj[header] = Number(row[index] || 0) / 10;
        }
        return obj;
      }, {});
    });
  } else {
    result = jsonData.slice(1).map((row) => {
      return tableHeaders.reduce((obj, header, index) => {
        obj[header] = row[index] || "";
        return obj;
      }, {});
    });
  }
  return result
}


const handleCompareTableData = (list, realBuyTable) => {
  // 2. 遍历list, 遍历realBuyTable, 找到城市、门店名称、商品名称相同的项, 累加购买数量
  list.forEach(item => {
    const realBuyList = realBuyTable.filter(realBuyItem => 
      realBuyItem['城市'] === item['城市'] &&
      realBuyItem['门店名称'] === item['门店名称'] &&
      realBuyItem['商品名称'] === item['商品名称']
    );
    if(realBuyList && realBuyList.length > 0) {
      item['购买数量'] = realBuyList.reduce((total, realBuyItem) => total + realBuyItem['购买数量'], 0);
      if(item['购买数量'] > item['店品条数']) {
        let x = new Decimal(item['购买数量']);
        let y = new Decimal(item['店品条数']);
        errorList.value.push({
          '城市': item['城市'],
          '门店名称': item['门店名称'],
          '多买的品种': item['商品名称'],
          '多买数量': x.minus(y).toFixed(1),
        })
      }
    } else {
      item['购买数量'] = 0;
    }
  });
  // 1. 根据城市 门店名称，商品名称，判断realBuyTable是否存在多余项
  let outletsList = [...new Set(list.map(item => item['门店名称']))].filter(item => item != '')
  let realBuyOutletsList =  [...new Set(realBuyTable.map(item => item['门店名称']))].filter(item => item != '')
  // 遍历门店，获取每个门店的商品名称 判断与实际购买是是否一致// 计算门店购买明细的总数量
  // let sum = 0
  outletsList.forEach(outlet => {
    let listItems = list.filter(item => item['门店名称'] === outlet);
    let categoryList = [...new Set(listItems.map(item => item['商品名称']))].filter(item => item != '')
    let realBuyOutletItems = realBuyTable.filter(item => item['门店名称'] === outlet);
    let realBuyCategoryList = [...new Set(realBuyOutletItems.map(item => item['商品名称']))].filter(item => item != '')
    // 对比两个数组的商品名称是否一致
    let extraCategories = realBuyCategoryList.filter(category => !categoryList.includes(category));
    if(extraCategories.length > 0) {
      // 打印多买的品种和数量
      extraCategories.forEach(category => {
        let extraQuantity = realBuyOutletItems.filter(item => item['商品名称'] === category).reduce((total, item) => total + item['购买数量'], 0);
        let outletInfo = listItems.find(item => item['门店名称'] === outlet);
        errorList.value.push({
          '城市': outletInfo['城市'],
          '门店名称': outlet,
          '多买的品种': category,
          '多买数量': extraQuantity,
        })
        console.log('买多了！', outlet, '多买的品种', category, '多买数量', extraQuantity);
        // throw new Error('门店:' + outlet + '多买了品种' + category + '，多买数量' + extraQuantity);
      })
    }
    // 购买单总数
    // let totalBuy = listItems.reduce((total, item) => total + item['购买数量'], 0);
    // console.log('output->outlet', outlet, '购买单购买数量', totalBuy);
    // let totalBuyQuantity = realBuyOutletItems.reduce((total, item) => total + item['购买数量'], 0);
    // console.log('output->outlet', outlet, '购买明细总数量', totalBuyQuantity);
    
  })
  return list
}

const getCellStyle = ({ row, column, rowIndex, columnIndex }) => {
  if (column.property === '购买数量' ) {
    if (row['购买数量'] > row['店品条数']) {
      return { backgroundColor: 'red' }; 
    } else if (row['购买数量'] < row['店品条数']) {
      return { backgroundColor: 'yellow' }; 
    } else {
      return ''
    }

  }
  return '';
}

const exportExcel = () => {
  exportExcelWithExcelJS(readSheetResult.value, errorList.value, `商品销售对比${+new Date()}.xlsx`);
};

const handleSheetChange = (sheetName) => {
  tableData.value = readSheetResult.value[sheetName];
}
const preview = () => {
  window.open('/docs/ee.pdf', '_blank');
}

</script>

