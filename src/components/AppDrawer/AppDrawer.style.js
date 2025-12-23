import { Drawer } from "@mui/material";
import { styled } from "@mui/material/styles";

export const DrawerWrapper = styled(Drawer)`
  & .MuiDrawer-paper {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    height: 100vh !important;
    min-height: 100vh !important;
    max-height: 100vh !important;
    border-right: 1px solid rgba(0, 0, 0, 0.06) !important;
    display: flex !important;
    flex-direction: column !important;
    background: #ffffff !important;
    box-shadow: 4px 0 20px rgba(0, 0, 0, 0.08) !important;
  }

  .drawer-header {
    position: relative;
    flex-shrink: 0;
    height: 64px;
    min-height: 64px;
    max-height: 64px;
    display: flex;
    align-items: center;
    padding: 0 24px;
    overflow: hidden;
    background: #ffffff;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }

  .logo-text {
    font-weight: 800;
    font-size: 1.875rem;
    letter-spacing: 3px;
    text-align: center;
    margin-bottom: 8px;
  }

  .logo-subtitle {
    font-size: 0.75rem;
    text-align: center;
    font-weight: 500;
    letter-spacing: 0.5px;
  }

  .btn-active {
    .MuiListItemIcon-root {
      color: white !important;
    }

    .MuiListItemText-primary {
      color: white !important;
      font-weight: 700 !important;
    }
  }

  .item-icon {
    min-width: 40px;
    padding-right: 12px;
    transition: all 0.2s ease;

    .icon {
      width: 1.5rem;
      height: 1.5rem;
      transition: all 0.2s ease;
    }
  }

  .MuiListItemText-primary {
    font-size: 0.95rem;
    font-weight: 500;
    transition: all 0.2s ease;
  }
`;

export default DrawerWrapper;
