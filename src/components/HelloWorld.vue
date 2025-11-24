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
  <el-button type="primary" @click="exportExcel">导出</el-button>
  <el-row :gutter="20">
    <el-col :span="18">
      <el-table :data="tableData" :cell-style="getCellStyle" border show-summary style="width: 100%">
        <el-table-column prop="城市" label="城市" width="100" />
        <el-table-column prop="门店名称" label="门店名称"  />
        <el-table-column prop="商品名称" label="商品名称" width="180"/>
        <el-table-column prop="店品条数" label="店品条数" width="100" />
        <el-table-column prop="购买数量" label="购买数量" width="100" />
      </el-table>
    </el-col>
    <!-- <el-col :span="12">
      <el-table :data="realBuyTable" border style="width: 100%">
        <el-table-column prop="城市" label="城市" width="100" />
        <el-table-column prop="门店名称" label="门店名称"  />
        <el-table-column prop="商品名称" label="商品名称" width="180"/>
        <el-table-column prop="购买数量" label="购买数量" width="100" />
      </el-table>
    </el-col> -->
  </el-row>
</template>

<script setup>
import { ref } from "vue";
import { read, writeFileXLSX, utils } from "xlsx";
import { ElMessage } from "element-plus";
import { getCell } from "element-plus/es/components/table/src/util.mjs";
import { exportExcelWithExcelJS } from "@/utils/exceljsExport";
const tableHeaders = ref([]);

const tableData = ref();
const realBuyTable = ref()
// 处理文件导入
const handleImport = (file) => {
  // 检查文件类型
  const isExcel = /\.(xlsx|xls)$/.test(file.name);
  if (!isExcel) {
    ElMessage.error("只能上传Excel文件!");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = read(data, { type: "array" });
      // 读取第一个sheet页
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      // 转换JSON数据
      const jsonData = utils.sheet_to_json(worksheet, { header: 1 });
      // 处理表头
      tableHeaders.value = jsonData[0];
      // 处理表格内容（跳过表头）
      tableData.value = jsonData.slice(1).map((row) => {
        return tableHeaders.value.reduce((obj, header, index) => {
          obj[header] = row[index] || "";
          return obj;
        }, {});
      });
      console.log('output->tableData.value',tableData.value);
      // 读取第二个sheet页
      const secondSheetName = workbook.SheetNames[1];
      const secondWorksheet = workbook.Sheets[secondSheetName];
      // 转换JSON数据
      const realBuyJsonData = utils.sheet_to_json(secondWorksheet, { header: 1 });
      // 处理表头
      tableHeaders.value = realBuyJsonData[0];
      // 处理表格内容（跳过表头）
      realBuyTable.value = realBuyJsonData.slice(1).map((row) => {
        return tableHeaders.value.reduce((obj, header, index) => {
          obj[header] = row[index] || "";
          if(header === '购买数量') {
            obj[header] = Number(row[index] || 0) / 10;
          }
          return obj;
        }, {});
      });
      console.log('output->realBuyTable.value',realBuyTable.value);
      handleCompareTableData()


      ElMessage.success("文件导入成功");
    } catch (error) {
      ElMessage.error("文件解析失败: " + error.message);
    }
  };
  reader.readAsArrayBuffer(file.raw);
};

const handleCompareTableData = () => {
  tableData.value.forEach(item => {
    const realBuyList = realBuyTable.value.filter(realBuyItem => 
      realBuyItem['城市'] === item['城市'] &&
      realBuyItem['门店名称'] === item['门店名称'] &&
      realBuyItem['商品名称'] === item['商品名称']
    );
    if(realBuyList && realBuyList.length > 0) {
      item['购买数量'] = realBuyList.reduce((total, realBuyItem) => total + realBuyItem['购买数量'], 0);
    } else {
      item['购买数量'] = 0;
    }
  });
}

const getCellStyle = ({ row, column, rowIndex, columnIndex }) => {
  if (column.property === '购买数量' && row['购买数量'] != row['店品条数']) {
    return { color: 'red' };
  }
  return '';
}

// const exportExcel = () => {
//   const worksheet = utils.json_to_sheet(tableData.value);
//   // 导出时，将购买数量不等于店品条数的单元格标红

//   const workbook = utils.book_new();
//   utils.book_append_sheet(workbook, worksheet, "Sheet1");
//   writeFileXLSX(workbook, "data.xlsx");
// };
const exportExcel = () => {
  exportExcelWithExcelJS(tableData.value, '商品销售对比.xlsx');
};

</script>

