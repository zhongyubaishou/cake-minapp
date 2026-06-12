<template>
  <div class="product-page">
    <div class="page-title-row">
      <div>
        <h1 class="page-title">商品管理</h1>
        <p class="page-subtitle">维护蛋糕商品、规格、价格和上下架状态</p>
      </div>
      <el-button v-if="hasPermission('product:manage')" type="primary" @click="openDialog()">新增商品</el-button>
    </div>

    <el-table :data="list" stripe v-loading="loading">
      <el-table-column prop="name" label="商品名称" />
      <el-table-column label="分类" width="120">
        <template #default="{ row }">{{ row.category?.name }}</template>
      </el-table-column>
      <el-table-column prop="basePrice" label="起售价(旧)" width="90" />
      <el-table-column label="每磅单价" width="90">
        <template #default="{ row }">¥{{ row.pricePerPound ?? 0 }}</template>
      </el-table-column>
      <el-table-column label="图片" width="80">
        <template #default="{ row }">
          <el-image :src="row.imageUrl || '/walk.jpg'" class="product-thumb" fit="cover" />
        </template>
      </el-table-column>
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.isOnSale ? 'success' : 'info'">{{ row.isOnSale ? '上架' : '下架' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="280" v-if="hasPermission('product:manage')">
        <template #default="{ row }">
          <el-button size="small" @click="openDialog(row)">编辑</el-button>
          <el-button v-if="row.isOnSale" size="small" type="warning" :loading="actionLoading" @click="toggle(row.id, false)">下架</el-button>
          <el-button v-else size="small" type="success" :loading="actionLoading" @click="toggle(row.id, true)">上架</el-button>
          <el-button size="small" type="danger" :loading="actionLoading" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog :title="isEdit ? '编辑商品' : '新增商品'" v-model="visible" width="600px">
      <el-form :model="form" label-width="100px" :rules="formRules">
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="分类" prop="categoryId">
          <el-select v-model="form.categoryId" placeholder="选择分类">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="起售价格(旧)">
          <el-input-number v-model="form.basePrice" :min="0" :precision="2" />
          <span style="margin-left:8px;color:#999;font-size:12px">已弃用，保留兼容</span>
        </el-form-item>
        <el-form-item label="每磅单价(元)">
          <el-input-number v-model="form.pricePerPound" :min="0" :precision="2" />
          <span style="margin-left:8px;color:#e8b830;font-size:12px">当前定价方式：每磅单价 × 磅数。0 则使用门店全局单价</span>
        </el-form-item>
        <el-form-item label="商品主图">
          <el-input v-model="form.imageUrl" placeholder="图片链接（或使用上传按钮）" />
          <input type="file" accept="image/*" @change="handleUpload" />
        </el-form-item>
        <el-form-item label="可选磅数">
          <el-input v-model="poundsStr" placeholder="用逗号分隔，如 1,2,3,4" />
        </el-form-item>
        <el-form-item label="默认磅数">
          <el-input-number v-model="form.defaultPound" :min="0.5" :step="0.5" />
        </el-form-item>
        <el-form-item label="可选口味">
          <el-input v-model="flavorsStr" placeholder="用逗号分隔，如 原味,巧克力 或 原味，巧克力" />
        </el-form-item>
        <el-form-item label="默认口味">
          <el-input v-model="form.defaultFlavor" />
        </el-form-item>
        <el-form-item label="可选主题">
          <el-input v-model="themesStr" placeholder="用逗号分隔，支持中英文逗号" />
        </el-form-item>
        <el-form-item label="默认主题">
          <el-input v-model="form.defaultTheme" />
        </el-form-item>
        <el-form-item label="介绍">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import http from '@/api/http';
import { hasPermission } from '@/utils/permissions';

const list = ref<any[]>([]);
const categories = ref<any[]>([]);
const loading = ref(false);
const visible = ref(false);
const isEdit = ref(false);
const saving = ref(false);
const actionLoading = ref(false);
const mounted = ref(true);
onUnmounted(() => { mounted.value = false });
const form = ref<any>({
  id: 0, categoryId: null, name: '', basePrice: 0, pricePerPound: 0, imageUrl: '',
  defaultPound: 2, defaultFlavor: '原味', defaultTheme: '成人',
  description: '', sortOrder: 0,
});
const poundsStr = ref('1,2,3,4');
const flavorsStr = ref('原味,巧克力');
const themesStr = ref('生日,节日,成人,儿童,老人');
const formRules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
};

async function fetch() {
  loading.value = true;
  try {
    const { data } = await http.get('/products');
    if (!mounted.value) return;
    if (data.code === 0) list.value = data.data.list;
  } finally {
    loading.value = false;
  }
}

async function fetchCategories() {
  try {
    const { data } = await http.get('/categories');
    if (!mounted.value) return;
    if (data.code === 0) categories.value = data.data;
  } catch {
    categories.value = [];
  }
}

function openDialog(row?: any) {
  if (row) {
    isEdit.value = true;
    form.value = {
      id: row.id, categoryId: row.categoryId || row.category?.id,
      name: row.name, basePrice: row.basePrice, pricePerPound: row.pricePerPound ?? 0,
      imageUrl: row.imageUrl || '',
      defaultPound: row.defaultPound, defaultFlavor: row.defaultFlavor,
      defaultTheme: row.defaultTheme, description: row.description || '',
      sortOrder: row.sortOrder ?? 0,
    };
    poundsStr.value = (row.availablePounds || []).join(',');
    flavorsStr.value = (row.availableFlavors || []).join(',');
    themesStr.value = (row.availableThemes || []).join(',');
  } else {
    isEdit.value = false;
    form.value = { id: 0, categoryId: null, name: '', basePrice: 0, pricePerPound: 0, imageUrl: '', defaultPound: 2, defaultFlavor: '原味', defaultTheme: '成人', description: '', sortOrder: 0 };
    poundsStr.value = '1,2,3,4';
    flavorsStr.value = '原味,巧克力';
    themesStr.value = '生日,节日,成人,儿童,老人';
  }
  visible.value = true;
}

async function handleSave() {
  saving.value = true;
  try {
    const payload = {
      categoryId: form.value.categoryId,
      name: form.value.name,
      basePrice: form.value.basePrice,
      pricePerPound: form.value.pricePerPound,
      imageUrl: form.value.imageUrl,
      defaultPound: form.value.defaultPound,
      defaultFlavor: form.value.defaultFlavor,
      defaultTheme: form.value.defaultTheme,
      description: form.value.description,
      sortOrder: form.value.sortOrder,
      availablePounds: poundsStr.value.split(/[,，]/).map(Number).filter((n) => !isNaN(n)),
      availableFlavors: flavorsStr.value.split(/[,，]/).map(s => s.trim()).filter(Boolean),
      availableThemes: themesStr.value.split(/[,，]/).map(s => s.trim()).filter(Boolean),
    };
    let res;
    if (isEdit.value) {
      res = await http.put(`/products/${form.value.id}`, payload);
    } else {
      res = await http.post('/products', payload);
    }
    if (!mounted.value) return;
    if (res.data.code === 0) {
      ElMessage.success('保存成功');
      visible.value = false;
      fetch();
    }
  } finally {
    saving.value = false;
  }
}

async function handleUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const fd = new FormData();
  fd.append('file', file);
  fd.append('bizType', 'PRODUCT');
  try {
    const { data } = await http.post('/upload', fd);
    if (!mounted.value) return;
    if (data.code === 0) {
      form.value.imageUrl = data.data.fileUrl;
      ElMessage.success('上传成功');
    }
  } catch {
    (e.target as HTMLInputElement).value = '';
    ElMessage.error('上传失败');
  }
}

async function toggle(id: number, on: boolean) {
  try {
    const action = on ? 'on' : 'off';
    const { data } = await http.post(`/products/${id}/${action}`);
    if (!mounted.value) return;
    if (data.code === 0) {
      ElMessage.success(on ? '已上架' : '已下架');
      fetch();
    }
  } catch {
    ElMessage.error('操作失败');
  }
}

async function handleDelete(row: any) {
  await ElMessageBox.confirm('确定删除该商品？', '提示', { type: 'warning' });
  const { data } = await http.delete(`/products/${row.id}`);
  if (data.code === 0) {
    ElMessage.success('删除成功');
    fetch();
  }
}

onMounted(() => { fetch(); fetchCategories(); });
</script>

<style scoped>
.product-page {
  max-width: 1440px;
}

.product-page :deep(.el-table) {
  border: 1px solid var(--cake-border);
}

.product-thumb {
  width: 52px;
  height: 52px;
  border-radius: 8px;
  background: #f0e7e0;
}

.no-image {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 8px;
  background: #f6f1ed;
  color: var(--cake-muted);
  font-size: 12px;
}

.product-page :deep(.el-dialog__body) {
  padding-top: 8px;
}
</style>
