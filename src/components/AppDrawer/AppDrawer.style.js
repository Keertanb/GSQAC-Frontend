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
    background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%) !important;
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.08) !important;
    backdrop-filter: blur(20px);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  }

  .drawer-header {
    position: relative;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(20px);
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
      color: inherit !important;
    }

    .MuiListItemText-primary {
      color: inherit !important;
      font-weight: 600 !important;
    }
  }

  .item-icon {
    min-width: 40px;
    padding-right: 12px;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

    .icon {
      width: 1.5rem;
      height: 1.5rem;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
  }

  .MuiListItemText-primary {
    font-size: 0.95rem;
    font-weight: 500;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
`;

export default DrawerWrapper;
