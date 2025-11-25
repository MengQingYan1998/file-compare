import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export const exportExcelWithExcelJS = async (data, filename = "data.xlsx") => {
  // 创建工作簿
  const workbook = new ExcelJS.Workbook();
  for (const key in data) {
    const elList = data[key];
    console.log("output->el", key, elList);
    if (key !== "购买明细") {
      let worksheet = workbook.addWorksheet(key);
      // 设置表头
      worksheet.columns = [
        { header: "城市", key: "城市", width: 15 },
        { header: "门店名称", key: "门店名称", width: 30 },
        { header: "商品名称", key: "商品名称", width: 40 },
        { header: "店品条数", key: "店品条数", width: 15 },
        { header: "购买数量", key: "购买数量", width: 15 },
      ];

      // 添加数据并设置样式
      elList.forEach((item, index) => {
        const row = worksheet.addRow(item);
        // 如果状态为不及格，整行标红
        if (item["购买数量"] > item["店品条数"]) {
          row.eachCell((cell) => {
            console.log('output->cell', cell);
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFF0000" }, // 红色背景
            };
            cell.font = {
              color: { argb: "FFFFFFFF" }, // 白色字体
              bold: true,
            };
            cell.alignment = {
              vertical: "middle",
              horizontal: "center",
            };
          });
        } else if (item["购买数量"] < item["店品条数"]) {
          row.eachCell((cell) => {
            console.log('output->cell', cell);
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFFF000" }, // 黄色背景
            };
            cell.font = {
              color: { argb: "FFFFFFFF" }, // 白色字体
              bold: true,
            };
            cell.alignment = {
              vertical: "middle",
              horizontal: "center",
            };
          });
        } else {
          // 其他行居中对齐
          row.eachCell((cell) => {
            cell.alignment = {
              vertical: "middle",
              horizontal: "center",
            };
          });
        }
      });

      // 设置表头样式
      const headerRow = worksheet.getRow(1);
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF366092" }, // 蓝色背景
        };
        cell.font = {
          color: { argb: "FFFFFFFF" }, // 白色字体
          bold: true,
        };
        cell.alignment = {
          vertical: "middle",
          horizontal: "center",
        };
      });
    }
  }
  // 导出文件
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  saveAs(blob, filename);
};
