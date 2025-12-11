import React, { useMemo, useState } from 'react';
import { useTable, useSortBy, usePagination, useGlobalFilter } from 'react-table';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useDebounce } from '../../hooks/useDebounce';

const TableContainer = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const TableHeader = styled.div`
  padding: 1rem;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SearchInput = styled.input`
  padding: 0.5rem;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 4px;
  font-size: 0.9rem;
  width: 300px;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHead = styled.thead`
  background-color: ${props => props.theme.colors.gray[50]};
`;

const TableRow = styled(motion.tr)`
  &:nth-child(even) {
    background-color: ${props => props.theme.colors.gray[25]};
  }

  &:hover {
    background-color: ${props => props.theme.colors.gray[100]};
  }
`;

const TableHeader = styled.th`
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: ${props => props.theme.colors.gray[700]};
  cursor: ${props => props.canSort ? 'pointer' : 'default'};
  user-select: none;

  &:hover {
    background-color: ${props => props.canSort ? props.theme.colors.gray[100] : 'transparent'};
  }
`;

const TableCell = styled.td`
  padding: 1rem;
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

const PaginationContainer = styled.div`
  padding: 1rem;
  display: flex;
  justify-content: between;
  align-items: center;
  border-top: 1px solid ${props => props.theme.colors.border};
`;

const PaginationButton = styled.button`
  padding: 0.5rem 1rem;
  margin: 0 0.25rem;
  border: 1px solid ${props => props.theme.colors.border};
  background: white;
  border-radius: 4px;
  cursor: pointer;
  
  &:hover:not(:disabled) {
    background-color: ${props => props.theme.colors.gray[50]};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &.active {
    background-color: ${props => props.theme.colors.primary};
    color: white;
    border-color: ${props => props.theme.colors.primary};
  }
`;

const PageInfo = styled.span`
  margin: 0 1rem;
  color: ${props => props.theme.colors.gray[600]};
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
`;

const DataTable = ({ 
  columns, 
  data, 
  loading = false,
  onRowClick,
  searchable = true,
  sortable = true,
  paginated = true,
  pageSize = 10 
}) => {
  const [globalFilter, setGlobalFilter] = useState('');
  const debouncedFilter = useDebounce(globalFilter, 300);

  const tableInstance = useTable(
    {
      columns,
      data,
      initialState: { 
        pageIndex: 0, 
        pageSize,
        globalFilter: debouncedFilter 
      },
      globalFilter: debouncedFilter,
    },
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize: setTablePageSize,
    state: { pageIndex, pageSize: currentPageSize },
  } = tableInstance;

  const handleRowClick = (row) => {
    if (onRowClick) {
      onRowClick(row.original);
    }
  };

  return (
    <TableContainer>
      {searchable && (
        <TableHeader>
          <h3>Data Table</h3>
          <SearchInput
            value={globalFilter || ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search..."
          />
        </TableHeader>
      )}
      
      <div style={{ position: 'relative' }}>
        {loading && (
          <LoadingOverlay>
            <div>Loading...</div>
          </LoadingOverlay>
        )}
        
        <Table {...getTableProps()}>
          <TableHead>
            {headerGroups.map(headerGroup => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(column => (
                  <TableHeader
                    {...column.getHeaderProps(
                      sortable ? column.getSortByToggleProps() : {}
                    )}
                    canSort={sortable && column.canSort}
                  >
                    {column.render('Header')}
                    {sortable && column.isSorted && (
                      <span>
                        {column.isSortedDesc ? ' 🔽' : ' 🔼'}
                      </span>
                    )}
                  </TableHeader>
                ))}
              </tr>
            ))}
          </TableHead>
          <tbody {...getTableBodyProps()}>
            {page.map((row, i) => {
              prepareRow(row);
              return (
                <TableRow
                  {...row.getRowProps()}
                  onClick={() => handleRowClick(row)}
                  style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  {row.cells.map(cell => (
                    <TableCell {...cell.getCellProps()}>
                      {cell.render('Cell')}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </tbody>
        </Table>
      </div>

      {paginated && (
        <PaginationContainer>
          <div>
            <PaginationButton
              onClick={() => gotoPage(0)}
              disabled={!canPreviousPage}
            >
              {'<<'}
            </PaginationButton>
            <PaginationButton
              onClick={() => previousPage()}
              disabled={!canPreviousPage}
            >
              {'<'}
            </PaginationButton>
            <PaginationButton
              onClick={() => nextPage()}
              disabled={!canNextPage}
            >
              {'>'}
            </PaginationButton>
            <PaginationButton
              onClick={() => gotoPage(pageCount - 1)}
              disabled={!canNextPage}
            >
              {'>>'}
            </PaginationButton>
          </div>
          
          <PageInfo>
            Page {pageIndex + 1} of {pageOptions.length} | 
            Showing {page.length} of {data.length} results
          </PageInfo>
          
          <select
            value={currentPageSize}
            onChange={e => setTablePageSize(Number(e.target.value))}
          >
            {[10, 20, 30, 40, 50].map(pageSize => (
              <option key={pageSize} value={pageSize}>
                Show {pageSize}
              </option>
            ))}
          </select>
        </PaginationContainer>
      )}
    </TableContainer>
  );
};

export default DataTable;