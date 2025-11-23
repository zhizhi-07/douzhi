import { TheatreTemplate } from '../../theatreTemplates'

export const gasRecordTemplate: TheatreTemplate = {
  id: 'gas_record',
  category: '生活消费',
  name: '加油小票',
  keywords: ['加油', '油费', '小票'],
  fields: [
    { key: 'STATION_NAME', label: '加油站', placeholder: '中国石化北京加油站' },
    { key: 'OIL_TYPE', label: '油品', placeholder: '95号汽油' },
    { key: 'PRICE_PER_LITER', label: '单价', placeholder: '8.92' },
    { key: 'LITERS', label: '升数', placeholder: '45.5' },
    { key: 'TOTAL_AMOUNT', label: '总金额', placeholder: '405.86' },
    { key: 'DATE_TIME', label: '时间', placeholder: '2024-11-22 18:30' },
    { key: 'MILEAGE', label: '里程', placeholder: '35600km' },
  ],
  htmlTemplate: `
<div data-gas-receipt style="background: #fff; padding: 20px; width: 100%; max-width: 280px; margin: 0 auto; font-family: 'Courier New', Courier, monospace; color: #333; box-shadow: 0 2px 10px rgba(0,0,0,0.05); position: relative; border-top: 5px solid #e74c3c;">
  <!-- Zigzag bottom -->
  <div style="position: absolute; bottom: -10px; left: 0; width: 100%; height: 10px; background: linear-gradient(45deg, transparent 33.333%, #fff 33.333%, #fff 66.667%, transparent 66.667%), linear-gradient(-45deg, transparent 33.333%, #fff 33.333%, #fff 66.667%, transparent 66.667%); background-size: 20px 40px;"></div>
  
  <div style="text-align: center; margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 15px;">
    <div style="font-weight: bold; font-size: 16px; margin-bottom: 5px;">{{STATION_NAME}}</div>
    <div style="font-size: 12px;">增值税电子普通发票</div>
  </div>
  
  <div style="font-size: 12px; line-height: 1.6; margin-bottom: 15px;">
    <div style="display: flex; justify-content: space-between;">
      <span>机号: 02</span>
      <span>流水: 102938</span>
    </div>
    <div style="display: flex; justify-content: space-between;">
      <span>时间: {{DATE_TIME}}</span>
    </div>
    <div style="display: flex; justify-content: space-between;">
      <span>里程: {{MILEAGE}}</span>
    </div>
  </div>
  
  <table style="width: 100%; font-size: 12px; margin-bottom: 15px; border-collapse: collapse;">
    <tr style="border-bottom: 1px dashed #000;">
      <th style="text-align: left; padding-bottom: 5px;">品名</th>
      <th style="text-align: center; padding-bottom: 5px;">单价</th>
      <th style="text-align: right; padding-bottom: 5px;">金额</th>
    </tr>
    <tr>
      <td style="padding-top: 5px;">{{OIL_TYPE}}</td>
      <td style="text-align: center; padding-top: 5px;">{{PRICE_PER_LITER}}</td>
      <td style="text-align: right; padding-top: 5px;">{{TOTAL_AMOUNT}}</td>
    </tr>
    <tr>
      <td colspan="3" style="font-size: 10px; color: #666; padding-bottom: 5px;">数量: {{LITERS}} 升</td>
    </tr>
  </table>
  
  <div style="border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 10px 0; margin-bottom: 20px;">
    <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14px;">
      <span>实收:</span>
      <span>¥{{TOTAL_AMOUNT}}</span>
    </div>
  </div>
  
  <div style="text-align: center;">
    <div style="display: inline-block; padding: 5px; background: #fff; border: 1px solid #000;">
      <!-- Simulated QR Code -->
      <div style="width: 80px; height: 80px; background: 
        linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000),
        linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000);
        background-size: 20px 20px; background-position: 0 0, 10px 10px; opacity: 0.8;"></div>
    </div>
    <div style="font-size: 10px; margin-top: 5px;">扫码开票</div>
    <div style="font-size: 10px; margin-top: 15px; color: #666;">谢谢惠顾，欢迎再次光临</div>
  </div>
</div>
  `.trim()
}
