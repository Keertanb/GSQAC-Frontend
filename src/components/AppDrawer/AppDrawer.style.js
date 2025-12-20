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
    border-right: 1px solid rgba(0, 0, 0, 0.12) !important;
    display: flex !important;
    flex-direction: column !important;
  }

  .drawer-header {
    gap: 16px;
    display: flex;
    align-items: center;
    flex-direction: column;
    padding: 24px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    min-height: 120px;
    height: auto;
    justify-content: center;
    position: relative;
    flex-shrink: 0;

    .logo-text {
      font-weight: 800;
      font-size: 1.75rem;
      letter-spacing: 2px;
      text-align: center;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .logo-subtitle {
      font-size: 0.75rem;
      opacity: 0.95;
      text-align: center;
      font-weight: 400;
    }
  }

  .btn-active {
    .MuiListItemIcon-root {
      color: white !important;
    }

    .MuiListItemText-primary {
      color: white !important;
      font-weight: 600 !important;
    }
  }

  .item-icon {
    color: ${(props) => props.theme.palette.text.primary};
    min-width: 40px;
    padding-right: 12px;

    .icon {
      width: 1.5rem;
      height: 1.5rem;

      &.active {
        color: white;
      }
    }
  }

  .MuiListItemButton-root {
    margin: 4px 8px;
    border-radius: 12px;
    transition: all 0.2s ease;

    &:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }
  }

  .MuiListItemText-primary {
    font-size: 0.95rem;
    font-weight: 500;
  }
`;

export default DrawerWrapper;
