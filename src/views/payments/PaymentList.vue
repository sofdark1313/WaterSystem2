  <el-table
    v-loading="loading"
    :data="tableData"
    border
    style="width: 100%; height: calc(100% - 55px);"
  >
    <!-- ... existing table columns ... -->
  </el-table>
  
  <!-- 分页区域 -->
  <div class="pagination-container">
    <el-pagination
      v-model:current-page="queryParams.page"
      v-model:page-size="queryParams.pageSize"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>

<style scoped>
.app-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.search-card {
  margin-bottom: 20px;
  flex-shrink: 0;
}

.table-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
  display: flex !important;
  justify-content: flex-end;
}

/* 确保el-card__body占满高度 */
:deep(.el-card__body) {
  height: calc(100% - 60px);
  display: flex;
  flex-direction: column;
}

/* 确保表格占满空间 */
:deep(.el-table) {
  flex: 1;
  height: calc(100% - 70px) !important;
}

/* 确保分页组件总是可见 */
:deep(.el-pagination) {
  display: flex !important;
  visibility: visible !important;
}
</style> 